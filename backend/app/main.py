"""
FastAPI application for nanoDSF analysis.

This is the main application file that integrates all agents, services, and endpoints.

To use this in your existing structure:
1. Place all agent files in backend/app/agents/
2. Place models in backend/app/models/
3. Place service in backend/app/services/
4. Place API endpoints in backend/app/api/v1/
5. Import and register routers as shown below
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from pathlib import Path

# Import routers
from app.api.v1 import analysis, simulator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context manager for application lifecycle management.
    """
    # Startup
    logger.info("Starting nanoDSF Analysis API")
    data_dir = Path("./data")
    data_dir.mkdir(exist_ok=True)
    logger.info(f"Data directory: {data_dir}")

    yield

    # Shutdown
    logger.info("Shutting down nanoDSF Analysis API")


# Create FastAPI app
app = FastAPI(
    title="nanoDSF Analysis API",
    description="AI-powered agent for analyzing nanoDifferential Scanning Fluorimetry (DSF) data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis.router)
app.include_router(simulator.router)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "nanoDSF Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "analysis": {
                "POST /api/v1/upload": "Upload and analyze nanoDSF data file",
                "GET /api/v1/results": "Retrieve stored analysis results",
                "GET /api/v1/results/{analysis_id}": "Get specific analysis result",
            },
            "simulation": {
                "POST /api/v1/simulate": "Simulate DSF curve",
                "POST /api/v1/simulate-batch": "Simulate multiple curves",
                "GET /api/v1/simulate/info": "Get simulation documentation",
            },
            "health": {
                "GET /api/v1/health": "Health check",
            },
            "docs": {
                "GET /docs": "Swagger UI documentation",
                "GET /redoc": "ReDoc documentation",
            },
        },
    }


if __name__ == "__main__":
    import uvicorn

    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )