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
    test_api_base_url: str = "https://api.example.com"
    test_timeout: int = 30
    test_retry_count: int = 3
    
    # Authentication
    test_email: Optional[str] = None
    test_password: Optional[str] = None
    test_auth_token: Optional[str] = None
    test_expired_token: Optional[str] = None
    test_api_key: Optional[str] = None
    test_limited_token: Optional[str] = None
    test_revoked_token: Optional[str] = None
    
    # Test Settings
    test_log_level: str = "DEBUG"
    concurrency_max_users: int = 5
    concurrency_requests_per_user: int = 3
    concurrency_timeout: int = 60
    performance_duration_seconds: int = 30
    performance_max_rps: int = 50
    boundary_test_enabled: bool = True
    boundary_string_max_length: int = 1000
    
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
    
    class Config:
        env_file = [".env.local", ".env.test", ".env"]
        env_file_encoding = "utf-8"