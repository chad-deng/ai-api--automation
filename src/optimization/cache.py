"""
Intelligent caching system for QA Review Workflow performance optimization.

Implements multi-layer caching strategy with Redis backend,
cache invalidation, and performance monitoring.
"""

import asyncio
import json
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, asdict
from functools import wraps
import hashlib
import structlog

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from ..monitoring.metrics import metrics

logger = structlog.get_logger()


@dataclass
class CacheConfig:
    """Cache configuration settings."""
    redis_url: str = "redis://localhost:6379/0"
    default_ttl_seconds: int = 3600  # 1 hour
    max_memory_cache_items: int = 1000
    enable_compression: bool = True
    enable_metrics: bool = True


@dataclass
class CacheStats:
    """Cache performance statistics."""
    hits: int = 0
    misses: int = 0
    sets: int = 0
    deletes: int = 0
    errors: int = 0
    total_size_bytes: int = 0
    
    @property
    def hit_ratio(self) -> float:
        """Calculate cache hit ratio percentage."""
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0.0


class InMemoryCache:
    """Fast in-memory cache layer for frequently accessed data."""
    
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_order: List[str] = []
        self._stats = CacheStats()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from memory cache."""
        try:
            if key in self._cache:
                entry = self._cache[key]
                
                # Check if expired
                if entry['expires_at'] and datetime.utcnow() > entry['expires_at']:
                    self.delete(key)
                    self._stats.misses += 1
                    return None
                
                # Update access order (LRU)
                if key in self._access_order:
                    self._access_order.remove(key)
                self._access_order.append(key)
                
                self._stats.hits += 1
                return entry['value']
            
            self._stats.misses += 1
            return None
            
        except Exception as e:
            self._stats.errors += 1
            logger.error("Memory cache get error", key=key, error=str(e))
            return None
    
    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        """Set value in memory cache."""
        try:
            # Evict oldest items if at capacity
            while len(self._cache) >= self.max_size and self._access_order:
                oldest_key = self._access_order.pop(0)
                self._cache.pop(oldest_key, None)
            
            expires_at = None
            if ttl_seconds:
                expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
            
            self._cache[key] = {
                'value': value,
                'created_at': datetime.utcnow(),
                'expires_at': expires_at
            }
            
            # Update access order
            if key in self._access_order:
                self._access_order.remove(key)
            self._access_order.append(key)
            
            self._stats.sets += 1
            
        except Exception as e:
            self._stats.errors += 1
            logger.error("Memory cache set error", key=key, error=str(e))
    
    def delete(self, key: str):
        """Delete key from memory cache."""
        try:
            if key in self._cache:
                del self._cache[key]
                if key in self._access_order:
                    self._access_order.remove(key)
                self._stats.deletes += 1
        except Exception as e:
            self._stats.errors += 1
            logger.error("Memory cache delete error", key=key, error=str(e))
    
    def clear(self):
        """Clear all cached data."""
        self._cache.clear()
        self._access_order.clear()
    
    def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        self._stats.total_size_bytes = sum(
            len(pickle.dumps(entry['value'])) 
            for entry in self._cache.values()
        )
        return self._stats


class RedisCache:
    """Redis-based distributed cache layer."""
    
    def __init__(self, config: CacheConfig):
        self.config = config
        self._redis: Optional[redis.Redis] = None
        self._stats = CacheStats()
        self._connected = False
    
    async def connect(self):
        """Connect to Redis server."""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available, distributed caching disabled")
            return
        
        try:
            self._redis = redis.from_url(
                self.config.redis_url,
                encoding='utf-8',
                decode_responses=False,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Test connection
            await self._redis.ping()
            self._connected = True
            
            logger.info("Redis cache connected", url=self.config.redis_url)
            
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            self._redis = None
            self._connected = False
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache."""
        if not self._connected or not self._redis:
            self._stats.errors += 1
            return None
        
        try:
            value = await self._redis.get(key)
            if value is not None:
                self._stats.hits += 1
                # Deserialize value
                if self.config.enable_compression:
                    return pickle.loads(value)
                else:
                    return json.loads(value.decode('utf-8'))
            else:
                self._stats.misses += 1
                return None
                
        except Exception as e:
            self._stats.errors += 1
            logger.error("Redis cache get error", key=key, error=str(e))
            return None
    
    async def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        """Set value in Redis cache."""
        if not self._connected or not self._redis:
            self._stats.errors += 1
            return
        
        try:
            # Serialize value
            if self.config.enable_compression:
                serialized = pickle.dumps(value)
            else:
                serialized = json.dumps(value, default=str).encode('utf-8')
            
            ttl = ttl_seconds or self.config.default_ttl_seconds
            await self._redis.setex(key, ttl, serialized)
            
            self._stats.sets += 1
            
        except Exception as e:
            self._stats.errors += 1
            logger.error("Redis cache set error", key=key, error=str(e))
    
    async def delete(self, key: str):
        """Delete key from Redis cache."""
        if not self._connected or not self._redis:
            return
        
        try:
            deleted = await self._redis.delete(key)
            if deleted:
                self._stats.deletes += 1
        except Exception as e:
            self._stats.errors += 1
            logger.error("Redis cache delete error", key=key, error=str(e))
    
    async def clear_pattern(self, pattern: str):
        """Clear keys matching pattern."""
        if not self._connected or not self._redis:
            return
        
        try:
            keys = await self._redis.keys(pattern)
            if keys:
                deleted = await self._redis.delete(*keys)
                self._stats.deletes += deleted
                logger.info("Cleared cache pattern", pattern=pattern, deleted=deleted)
        except Exception as e:
            self._stats.errors += 1
            logger.error("Redis cache pattern clear error", pattern=pattern, error=str(e))
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self._redis:
            await self._redis.close()
            self._connected = False
    
    def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        return self._stats


class CacheManager:
    """
    Multi-layer cache manager with intelligent cache strategies.
    
    Implements L1 (memory) and L2 (Redis) caching with automatic
    invalidation and performance monitoring.
    """
    
    def __init__(self, config: CacheConfig):
        self.config = config
        self.memory_cache = InMemoryCache(config.max_memory_cache_items)
        self.redis_cache = RedisCache(config) if REDIS_AVAILABLE else None
        self.logger = structlog.get_logger()
        
        # Cache invalidation patterns
        self.invalidation_patterns = {
            'review_performance': ['review:*', 'performance:*'],
            'quality_metrics': ['quality:*', 'metrics:*'],
            'reviewer_stats': ['reviewer:*'],
            'api_endpoint': ['api:*', 'endpoint:*'],
            'queue_status': ['queue:*']
        }
    
    async def initialize(self):
        """Initialize cache manager."""
        if self.redis_cache:
            await self.redis_cache.connect()
        
        logger.info("Cache manager initialized", 
                   memory_enabled=True,
                   redis_enabled=self.redis_cache._connected if self.redis_cache else False)
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (L1 then L2)."""
        # Try L1 cache first
        value = self.memory_cache.get(key)
        if value is not None:
            if self.config.enable_metrics:
                metrics.record_cache_operation('get', True, 'memory')
            return value
        
        # Try L2 cache (Redis)
        if self.redis_cache:
            value = await self.redis_cache.get(key)
            if value is not None:
                # Populate L1 cache for faster future access
                self.memory_cache.set(key, value, ttl_seconds=300)  # 5 minute L1 TTL
                if self.config.enable_metrics:
                    metrics.record_cache_operation('get', True, 'redis')
                return value
        
        # Cache miss
        if self.config.enable_metrics:
            cache_type = 'redis' if self.redis_cache else 'memory'
            metrics.record_cache_operation('get', False, cache_type)
        
        return None
    
    async def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        """Set value in cache (both L1 and L2)."""
        # Set in L1 cache
        l1_ttl = min(ttl_seconds or 3600, 3600)  # L1 max 1 hour
        self.memory_cache.set(key, value, l1_ttl)
        
        # Set in L2 cache
        if self.redis_cache:
            await self.redis_cache.set(key, value, ttl_seconds)
        
        if self.config.enable_metrics:
            cache_type = 'redis' if self.redis_cache else 'memory'
            metrics.record_cache_operation('set', True, cache_type)
    
    async def delete(self, key: str):
        """Delete key from all cache layers."""
        self.memory_cache.delete(key)
        if self.redis_cache:
            await self.redis_cache.delete(key)
    
    async def invalidate_pattern(self, pattern_name: str):
        """Invalidate cache entries by pattern name."""
        patterns = self.invalidation_patterns.get(pattern_name, [])
        
        for pattern in patterns:
            # Clear from memory cache (simple key matching)
            keys_to_delete = [
                key for key in self.memory_cache._cache.keys() 
                if self._pattern_matches(key, pattern)
            ]
            for key in keys_to_delete:
                self.memory_cache.delete(key)
            
            # Clear from Redis cache
            if self.redis_cache:
                await self.redis_cache.clear_pattern(pattern)
        
        logger.info("Cache invalidated", pattern_name=pattern_name, patterns=patterns)
    
    def _pattern_matches(self, key: str, pattern: str) -> bool:
        """Simple pattern matching for cache keys."""
        if pattern.endswith('*'):
            return key.startswith(pattern[:-1])
        return key == pattern
    
    async def get_combined_stats(self) -> Dict[str, Any]:
        """Get combined cache statistics."""
        memory_stats = self.memory_cache.get_stats()
        redis_stats = self.redis_cache.get_stats() if self.redis_cache else CacheStats()
        
        return {
            'memory_cache': asdict(memory_stats),
            'redis_cache': asdict(redis_stats),
            'combined': {
                'total_hits': memory_stats.hits + redis_stats.hits,
                'total_misses': memory_stats.misses + redis_stats.misses,
                'overall_hit_ratio': (
                    (memory_stats.hits + redis_stats.hits) / 
                    max(memory_stats.hits + memory_stats.misses + redis_stats.hits + redis_stats.misses, 1) * 100
                ),
                'total_errors': memory_stats.errors + redis_stats.errors
            }
        }


def cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate consistent cache key from arguments."""
    # Create hash from arguments for consistent keys
    key_parts = [prefix]
    
    # Add positional arguments
    for arg in args:
        key_parts.append(str(arg))
    
    # Add keyword arguments (sorted for consistency)
    for k, v in sorted(kwargs.items()):
        key_parts.append(f"{k}:{v}")
    
    key_string = ":".join(key_parts)
    
    # Hash long keys to avoid Redis key size limits
    if len(key_string) > 200:
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{prefix}:hash:{key_hash}"
    
    return key_string


def cached(
    prefix: str, 
    ttl_seconds: int = 3600,
    invalidation_pattern: Optional[str] = None
):
    """
    Decorator for caching function results.
    
    Args:
        prefix: Cache key prefix
        ttl_seconds: Time to live in seconds
        invalidation_pattern: Pattern name for cache invalidation
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key = cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = await cache_manager.get(key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(key, result, ttl_seconds)
            
            return result
        
        # Add cache invalidation method to function
        wrapper.invalidate_cache = lambda *args, **kwargs: cache_manager.delete(
            cache_key(prefix, *args, **kwargs)
        )
        wrapper.invalidate_pattern = lambda: cache_manager.invalidate_pattern(
            invalidation_pattern
        ) if invalidation_pattern else None
        
        return wrapper
    return decorator


class ReviewCacheService:
    """
    High-level caching service for QA Review Workflow operations.
    
    Provides domain-specific caching methods with intelligent
    invalidation and performance optimization.
    """
    
    def __init__(self, cache_manager: CacheManager):
        self.cache = cache_manager
        self.logger = structlog.get_logger()
    
    @cached('review_performance', ttl_seconds=1800, invalidation_pattern='review_performance')
    async def get_review_performance_cached(
        self, 
        hours: int = 24,
        api_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Cached review performance metrics."""
        from .database import db_optimizer
        return await db_optimizer.get_review_performance_optimized(hours, api_type)
    
    @cached('queue_metrics', ttl_seconds=300, invalidation_pattern='queue_status')
    async def get_queue_metrics_cached(self) -> Dict[str, Any]:
        """Cached queue metrics with 5-minute TTL."""
        from .database import db_optimizer
        return await db_optimizer.get_queue_metrics_optimized()
    
    @cached('reviewer_performance', ttl_seconds=3600, invalidation_pattern='reviewer_stats')
    async def get_reviewer_performance_cached(
        self, 
        reviewer_ids: List[str],
        hours: int = 24
    ) -> Dict[str, Dict[str, Any]]:
        """Cached reviewer performance metrics."""
        from .database import db_optimizer
        return await db_optimizer.get_reviewer_performance_batch(reviewer_ids, hours)
    
    @cached('api_complexity', ttl_seconds=7200)  # 2 hours
    async def get_api_complexity_mapping(self) -> Dict[str, str]:
        """Cached API endpoint complexity mapping."""
        # This would typically query the database for API complexity data
        return {
            'POST /api/v1/users': 'simple',
            'GET /api/v1/reports/complex': 'complex',
            'POST /api/v1/integrations/webhook': 'complex'
        }
    
    async def invalidate_review_caches(self, review_id: Optional[str] = None):
        """Invalidate review-related caches after review completion."""
        await self.cache.invalidate_pattern('review_performance')
        await self.cache.invalidate_pattern('quality_metrics')
        
        if review_id:
            await self.cache.delete(f"review:{review_id}")
        
        self.logger.info("Review caches invalidated", review_id=review_id)
    
    async def invalidate_queue_caches(self):
        """Invalidate queue-related caches after queue changes."""
        await self.cache.invalidate_pattern('queue_status')
        self.logger.info("Queue caches invalidated")
    
    async def warm_critical_caches(self):
        """Pre-warm critical caches with frequently accessed data."""
        try:
            # Warm review performance cache
            await self.get_review_performance_cached(hours=24)
            await self.get_review_performance_cached(hours=1)  # Recent data
            
            # Warm queue metrics
            await self.get_queue_metrics_cached()
            
            # Warm API complexity mapping
            await self.get_api_complexity_mapping()
            
            self.logger.info("Critical caches warmed")
            
        except Exception as e:
            self.logger.error("Failed to warm caches", error=str(e))


# Global cache manager instance
cache_config = CacheConfig()
cache_manager = CacheManager(cache_config)
review_cache = ReviewCacheService(cache_manager)