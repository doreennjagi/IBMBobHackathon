"""
SubLeech Backend API - Main Application Entry Point

This is the FastAPI application that powers SubLeech's subscription intelligence platform.
It provides endpoints for CSV ingestion, subscription analysis, and AI agent invocation.

Built with IBM Bob for accelerated development.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import ping_database
from app.routers import ingest, subscriptions, agents

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="SubLeech API",
    description="AI-Powered Subscription Intelligence & Financial Defense System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["CSV Ingestion"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["Subscriptions"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["AI Agents"])


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "service": "SubLeech API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    db_ok = ping_database()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "unavailable",
        "redis": "unknown",  # TODO: ping Redis when broker is wired
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later."
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

# Made with Bob
