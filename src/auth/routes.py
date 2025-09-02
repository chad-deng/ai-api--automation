"""
Authentication routes for login/logout
"""
from fastapi import APIRouter, Request, Form, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import structlog
from src.auth.session import session_auth, get_current_user_optional

logger = structlog.get_logger()
auth_router = APIRouter(prefix="/auth", tags=["auth"])

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="src/templates")

# Simple user database (in production, this would be a proper database)
DEMO_USERS = {
    "admin": {
        "password": "admin123",  # In production, this would be hashed
        "name": "Admin User",
        "role": "admin"
    },
    "reviewer": {
        "password": "reviewer123",
        "name": "Senior Reviewer",
        "role": "reviewer"
    },
    "developer": {
        "password": "dev123",
        "name": "Developer",
        "role": "developer"
    }
}

@auth_router.get("/login", response_class=HTMLResponse, name="login_form")
async def login_form(
    request: Request,
    current_user: dict = Depends(get_current_user_optional)
):
    """Show login form"""
    # Redirect if already logged in
    if current_user:
        return RedirectResponse(url="/reviews/", status_code=302)
    
    return templates.TemplateResponse("auth/login.html", {
        "request": request
    })

@auth_router.post("/login")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    next_url: str = Form(default="/reviews/")
):
    """Process login"""
    try:
        # Validate credentials
        user = DEMO_USERS.get(username)
        if not user or user["password"] != password:
            return templates.TemplateResponse("auth/login.html", {
                "request": request,
                "error": "Invalid username or password",
                "username": username
            })
        
        # Create session
        session_id = session_auth.create_session(username, {
            "name": user["name"],
            "role": user["role"]
        })
        
        # Create response with session cookie
        response = RedirectResponse(url=next_url, status_code=302)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=24*60*60  # 24 hours
        )
        
        logger.info("User logged in", username=username)
        return response
        
    except Exception as e:
        logger.error("Login failed", error=str(e), username=username)
        return templates.TemplateResponse("auth/login.html", {
            "request": request,
            "error": "Login failed. Please try again.",
            "username": username
        })

@auth_router.post("/logout")
async def logout(request: Request):
    """Process logout"""
    session_auth.logout(request)
    
    response = RedirectResponse(url="/auth/login", status_code=302)
    response.delete_cookie("session_id")
    
    return response

@auth_router.get("/profile", response_class=HTMLResponse, name="user_profile")
async def user_profile(
    request: Request,
    current_user: dict = Depends(get_current_user_optional)
):
    """Show user profile"""
    if not current_user:
        return RedirectResponse(url="/auth/login", status_code=302)
    
    return templates.TemplateResponse("auth/profile.html", {
        "request": request,
        "user": current_user
    })