"""
Basic session-based authentication for the review workflow
"""
from fastapi import Request, HTTPException, status
from typing import Optional
import structlog

logger = structlog.get_logger()

class SessionAuth:
    """Simple session-based authentication"""
    
    def __init__(self):
        # In production, this would be stored in Redis or database
        self.active_sessions = {}
    
    def create_session(self, user_id: str, user_info: dict) -> str:
        """Create a new session for user"""
        import uuid
        session_id = str(uuid.uuid4())
        
        self.active_sessions[session_id] = {
            "user_id": user_id,
            "user_info": user_info,
            "created_at": "now"  # In production, use proper datetime
        }
        
        logger.info("Created session", user_id=user_id, session_id=session_id)
        return session_id
    
    def get_current_user(self, request: Request) -> Optional[dict]:
        """Get current user from session"""
        session_id = request.cookies.get("session_id")
        if not session_id:
            return None
            
        session = self.active_sessions.get(session_id)
        if not session:
            return None
            
        return {
            "user_id": session["user_id"],
            **session["user_info"]
        }
    
    def logout(self, request: Request) -> bool:
        """Remove session"""
        session_id = request.cookies.get("session_id")
        if session_id and session_id in self.active_sessions:
            user_id = self.active_sessions[session_id]["user_id"]
            del self.active_sessions[session_id]
            logger.info("Logged out user", user_id=user_id, session_id=session_id)
            return True
        return False

# Global session manager
session_auth = SessionAuth()

def get_current_user(request: Request) -> Optional[dict]:
    """Dependency to get current user"""
    return session_auth.get_current_user(request)

def require_auth(request: Request) -> dict:
    """Dependency that requires authentication"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user

def get_current_user_optional(request: Request) -> Optional[dict]:
    """Optional dependency for current user"""
    return get_current_user(request)