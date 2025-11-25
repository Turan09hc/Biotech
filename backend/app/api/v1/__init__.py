from fastapi import APIRouter
from .analysis import router as analysis_router
from .simulator import router as simulator_router

api_router = APIRouter()
api_router.include_router(analysis_router, prefix="/analysis")
api_router.include_router(simulator_router, prefix="/simulate")

__all__ = ["api_router"]
