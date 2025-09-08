"""
端点验证器 - 验证OpenAPI规范中的端点是否在实际应用中存在
"""
import structlog
from typing import List, Dict, Set, Tuple
from fastapi import FastAPI
from pathlib import Path
import importlib.util
import sys

logger = structlog.get_logger()

class EndpointValidator:
    """验证OpenAPI规范中的端点是否在实际应用中实现"""
    
    def __init__(self, app_module_path: str = "src.main"):
        """
        初始化端点验证器
        
        Args:
            app_module_path: FastAPI应用模块路径
        """
        self.app_module_path = app_module_path
        self._actual_endpoints = None
    
    def get_actual_endpoints(self) -> Set[Tuple[str, str]]:
        """
        从FastAPI应用获取实际存在的端点
        
        Returns:
            Set of (method, path) tuples
        """
        if self._actual_endpoints is not None:
            return self._actual_endpoints
            
        try:
            # 动态导入应用模块
            if self.app_module_path in sys.modules:
                app_module = sys.modules[self.app_module_path]
            else:
                app_module = importlib.import_module(self.app_module_path)
            
            # 获取FastAPI应用实例
            if hasattr(app_module, 'app'):
                app = app_module.app
            elif hasattr(app_module, 'create_app'):
                app = app_module.create_app()
            else:
                logger.error("Unable to find FastAPI app instance")
                return set()
            
            # 提取所有路由
            endpoints = set()
            for route in app.routes:
                if hasattr(route, 'methods') and hasattr(route, 'path'):
                    for method in route.methods:
                        if method != 'HEAD':  # 忽略HEAD方法
                            endpoints.add((method, route.path))
            
            self._actual_endpoints = endpoints
            logger.info(f"发现 {len(endpoints)} 个实际端点")
            return endpoints
            
        except Exception as e:
            logger.error(f"获取实际端点失败: {e}")
            return set()
    
    def get_openapi_endpoints(self, openapi_spec: Dict) -> Set[Tuple[str, str]]:
        """
        从OpenAPI规范提取端点
        
        Args:
            openapi_spec: OpenAPI规范字典
            
        Returns:
            Set of (method, path) tuples
        """
        endpoints = set()
        paths = openapi_spec.get('paths', {})
        
        for path, path_spec in paths.items():
            for method, method_spec in path_spec.items():
                if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                    endpoints.add((method.upper(), path))
        
        return endpoints
    
    def validate_endpoints(self, openapi_spec: Dict) -> Dict:
        """
        验证OpenAPI规范中的端点是否在实际应用中存在
        
        Args:
            openapi_spec: OpenAPI规范字典
            
        Returns:
            验证结果字典
        """
        actual_endpoints = self.get_actual_endpoints()
        openapi_endpoints = self.get_openapi_endpoints(openapi_spec)
        
        # 找到存在的端点
        existing_endpoints = actual_endpoints.intersection(openapi_endpoints)
        
        # 找到缺失的端点（在OpenAPI中但不在实际应用中）
        missing_endpoints = openapi_endpoints - actual_endpoints
        
        # 找到额外的端点（在实际应用中但不在OpenAPI中）
        extra_endpoints = actual_endpoints - openapi_endpoints
        
        result = {
            "existing_endpoints": existing_endpoints,
            "missing_endpoints": missing_endpoints,
            "extra_endpoints": extra_endpoints,
            "total_openapi_endpoints": len(openapi_endpoints),
            "total_actual_endpoints": len(actual_endpoints),
            "coverage_percentage": len(existing_endpoints) / len(openapi_endpoints) * 100 if openapi_endpoints else 0
        }
        
        logger.info("端点验证完成", 
                   existing=len(existing_endpoints),
                   missing=len(missing_endpoints),
                   extra=len(extra_endpoints),
                   coverage=f"{result['coverage_percentage']:.1f}%")
        
        return result
    
    def filter_openapi_spec(self, openapi_spec: Dict) -> Dict:
        """
        过滤OpenAPI规范，只保留实际存在的端点
        
        Args:
            openapi_spec: 原始OpenAPI规范
            
        Returns:
            过滤后的OpenAPI规范
        """
        actual_endpoints = self.get_actual_endpoints()
        
        if not actual_endpoints:
            logger.warning("没有找到实际端点，返回原始规范")
            return openapi_spec
        
        # 创建新的规范副本
        filtered_spec = openapi_spec.copy()
        filtered_paths = {}
        
        paths = openapi_spec.get('paths', {})
        
        for path, path_spec in paths.items():
            filtered_path_spec = {}
            
            for method, method_spec in path_spec.items():
                if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                    endpoint = (method.upper(), path)
                    if endpoint in actual_endpoints:
                        filtered_path_spec[method] = method_spec
                else:
                    # 保留非HTTP方法的规范（如parameters等）
                    filtered_path_spec[method] = method_spec
            
            # 只有当路径包含有效端点时才保留
            if any(method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] 
                   for method in filtered_path_spec.keys()):
                filtered_paths[path] = filtered_path_spec
        
        filtered_spec['paths'] = filtered_paths
        
        original_count = sum(len([m for m in path_spec.keys() 
                                if m.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']])
                           for path_spec in paths.values())
        filtered_count = sum(len([m for m in path_spec.keys() 
                                if m.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']])
                           for path_spec in filtered_paths.values())
        
        logger.info(f"OpenAPI规范过滤完成: {original_count} -> {filtered_count} 个端点")
        
        return filtered_spec


def create_minimal_openapi_spec() -> Dict:
    """
    创建一个包含实际存在端点的最小OpenAPI规范
    """
    validator = EndpointValidator()
    actual_endpoints = validator.get_actual_endpoints()
    
    paths = {}
    for method, path in actual_endpoints:
        if path not in paths:
            paths[path] = {}
        
        paths[path][method.lower()] = {
            "summary": f"{method} {path}",
            "description": f"Auto-generated endpoint definition for {method} {path}",
            "responses": {
                "200": {
                    "description": "Successful response",
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object"
                            }
                        }
                    }
                },
                "400": {
                    "description": "Bad Request"
                },
                "404": {
                    "description": "Not Found"
                },
                "500": {
                    "description": "Internal Server Error"
                }
            }
        }
        
        # 为POST/PUT/PATCH请求添加请求体
        if method in ['POST', 'PUT', 'PATCH']:
            paths[path][method.lower()]["requestBody"] = {
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object"
                        }
                    }
                }
            }
    
    spec = {
        "openapi": "3.0.1",
        "info": {
            "title": "Auto-generated API Specification",
            "version": "1.0.0",
            "description": "Automatically generated from actual FastAPI endpoints"
        },
        "paths": paths
    }
    
    logger.info(f"创建了包含 {len(actual_endpoints)} 个端点的最小规范")
    return spec