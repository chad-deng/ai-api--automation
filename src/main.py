"""
Main FastAPI application for AI API Test Automation.
"""

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config.settings import Settings
from src.database.models import init_db
from src.webhook.routes import webhook_router
from src.utils.logging import setup_logging

logger = structlog.get_logger()


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured FastAPI application instance
    """
    # Initialize settings
    settings = Settings()
    
    # Setup logging
    setup_logging()
    
    # Create FastAPI app
    app = FastAPI(
        title="AI API Test Automation",
        description="Automated test generation from ApiFox webhooks",
        version="1.0.0"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(webhook_router)
    
    @app.on_event("startup")
    async def startup_event():
        """Initialize database and start services."""
        logger.info("Starting AI API Test Automation service")
        await init_db()
    
    @app.on_event("shutdown")
    async def shutdown_event():
        """Clean up on shutdown."""
        logger.info("Shutting down AI API Test Automation service")
    
    return app


# Create app instance for uvicorn
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )