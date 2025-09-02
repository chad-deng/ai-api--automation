from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class ApiFoxWebhook(BaseModel):
    event_id: str
    event_type: str
    project_id: str
    timestamp: datetime
    data: Dict[str, Any]
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ApiSpec(BaseModel):
    id: str
    name: str
    method: str
    path: str
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    request_body: Optional[Dict[str, Any]] = None
    responses: Optional[Dict[str, Any]] = None