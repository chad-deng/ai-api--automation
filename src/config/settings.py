from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "sqlite:///./test_automation.db"
    test_database_url: str = "sqlite:///./test_automation.db"
    apifox_webhook_secret: Optional[str] = None
    log_level: str = "INFO"
    test_output_dir: str = "./tests/generated"
    max_retry_attempts: int = 3
    retry_delay: int = 1
    
    # Test API Configuration
    test_api_base_url: str = "http://192.168.1.140:3001"
    test_timeout: int = 30
    test_retry_count: int = 3
    
    # Authentication
    test_email: Optional[str] = None
    test_password: Optional[str] = None
    test_username: Optional[str] = None
    test_auth_token: Optional[str] = None
    test_expired_token: Optional[str] = None
    test_api_key: Optional[str] = None
    test_limited_token: Optional[str] = None
    test_revoked_token: Optional[str] = None
    
    # Test Settings - Reduced performance test generation
    test_log_level: str = "DEBUG"
    concurrency_max_users: int = 3          # Reduced from 5
    concurrency_requests_per_user: int = 2  # Reduced from 3
    concurrency_timeout: int = 30            # Reduced from 60
    performance_duration_seconds: int = 15   # Reduced from 30
    performance_max_rps: int = 20            # Reduced from 50
    boundary_test_enabled: bool = False      # Disabled to reduce complexity
    boundary_string_max_length: int = 500    # Reduced from 1000
    
    # Test Data
    test_campaign_id: Optional[str] = None
    test_business_id: Optional[str] = None
    
    # Cookies
    test_cookie_hpvn: Optional[str] = None
    test_cookie_perm_tid: Optional[str] = None
    test_cookie_fbp: Optional[str] = None
    test_cookie_initial_traffic_source: Optional[str] = None
    test_cookie_hj_session: Optional[str] = None
    test_cookie_hj_session_user: Optional[str] = None
    test_cookie_connect_sid: Optional[str] = None
    
    # Git Integration Configuration
    git_author_name: Optional[str] = "AI Test Automation"
    git_author_email: Optional[str] = "automation@company.com"
    auto_regenerate_rejected_tests: bool = True
    minimum_quality_score: int = 7
    review_stall_threshold_hours: int = 48
    
    # Email/SMTP Configuration
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    smtp_tls: bool = True
    
    # Slack Configuration
    slack_webhook_url: Optional[str] = None
    slack_channel: Optional[str] = "#test-automation"
    
    # Webhook Configuration
    webhook_timeout: int = 30
    webhook_retry_attempts: int = 3
    
    # Performance Monitoring Configuration
    performance_monitoring_enabled: bool = True
    performance_redis_url: str = "redis://localhost:6379/1"
    performance_database_url: Optional[str] = None  # Uses main database if not specified
    performance_collection_interval: int = 30  # seconds
    performance_batch_size: int = 100
    performance_retention_days: int = 90
    
    # Performance Baselines
    baseline_calculation_enabled: bool = True
    baseline_min_samples: int = 100
    baseline_confidence_level: float = 0.95
    baseline_recalculation_hours: int = 24
    
    # Anomaly Detection
    anomaly_detection_enabled: bool = True
    anomaly_sensitivity: float = 0.1  # 0.0 = low sensitivity, 1.0 = high sensitivity
    anomaly_ensemble_voting_threshold: float = 0.6
    
    # Performance Alerting
    performance_alerting_enabled: bool = True
    performance_alert_rate_limit: int = 100  # Max alerts per hour
    
    # Performance Thresholds
    test_execution_time_warning: float = 5.0  # seconds
    test_execution_time_critical: float = 10.0  # seconds
    api_response_time_warning: float = 2.0  # seconds
    api_response_time_critical: float = 5.0  # seconds
    memory_usage_warning: float = 80.0  # percent
    memory_usage_critical: float = 95.0  # percent
    cpu_usage_warning: float = 80.0  # percent
    cpu_usage_critical: float = 95.0  # percent
    error_rate_warning: float = 5.0  # percent
    error_rate_critical: float = 10.0  # percent
    
    class Config:
        env_file = [".env.local", ".env.test", ".env"]
        env_file_encoding = "utf-8"