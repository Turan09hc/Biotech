from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional

from app.services.dsf_service import DSFService
from app.models.dsf_models import SimulationParameters  # FIXED

router = APIRouter(prefix="/api/v1", tags=["simulation"])

# Initialize service
dsf_service = DSFService()



class SimulationRequest(BaseModel):
    """Request model for DSF curve simulation"""
    base_tm: float = Field(..., description="Base melting temperature (°C)", ge=20, le=100)
    base_amplitude: float = Field(
        default=0.3, description="Transition amplitude", ge=0.05, le=1.0
    )
    ph: Optional[float] = Field(
        default=7.4, description="Solution pH", ge=4.0, le=10.0
    )
    protein_concentration: Optional[float] = Field(
        default=1.0, description="Protein concentration (mg/mL)", ge=0.01, le=100.0
    )
    ligand_affinity: Optional[float] = Field(
        default=0.0, description="Ligand-induced Tm shift (°C)", ge=-10.0, le=20.0
    )
    temperature_range_start: float = Field(
        default=20, description="Start temperature (°C)", ge=0
    )
    temperature_range_end: float = Field(
        default=95, description="End temperature (°C)", le=150
    )


@router.post("/simulate")
async def simulate_dsf_curve(request: SimulationRequest) -> JSONResponse:
    """
    Generate simulated nanoDSF curve based on parameters.

    This endpoint simulates a DSF curve with realistic behavior based on:
    - Base melting temperature (Tm)
    - pH effects (±0.5°C per pH unit shift from 7.4)
    - Protein concentration (logarithmic effect)
    - Ligand binding (shifts Tm)
    - Transition amplitude and temperature range

    Args:
        request: SimulationRequest with curve parameters

    Returns:
        JSON with simulated temperatures, ratios, and predicted Tm
    """
    try:
        # Validate temperature range
        if request.temperature_range_end <= request.temperature_range_start:
            raise ValueError(
                "temperature_range_end must be greater than temperature_range_start"
            )

        # Create simulation parameters
        params = SimulationParameters(
            base_tm=request.base_tm,
            base_amplitude=request.base_amplitude,
            ph=request.ph,
            protein_concentration=request.protein_concentration,
            ligand_affinity=request.ligand_affinity,
            temperature_range=(request.temperature_range_start, request.temperature_range_end),
        )

        # Run simulation
        result = dsf_service.simulate_curve(params)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Simulation completed successfully",
                "data": {
                    "temperatures": result.temperatures,
                    "ratios": result.ratios,
                    "predicted_tm": result.predicted_tm,
                    "parameters": {
                        "base_tm": result.parameters_used.base_tm,
                        "base_amplitude": result.parameters_used.base_amplitude,
                        "ph": result.parameters_used.ph,
                        "protein_concentration": result.parameters_used.protein_concentration,
                        "ligand_affinity": result.parameters_used.ligand_affinity,
                    },
                },
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/simulate-batch")
async def simulate_batch(requests: list[SimulationRequest]) -> JSONResponse:
    """
    Generate multiple simulated DSF curves.

    Args:
        requests: List of SimulationRequest objects

    Returns:
        JSON array with all simulated curves
    """
    try:
        if not requests:
            raise ValueError("At least one simulation request is required")

        if len(requests) > 100:
            raise ValueError("Maximum 100 simulations per batch")

        results = []

        for idx, request in enumerate(requests):
            try:
                # Validate temperature range
                if request.temperature_range_end <= request.temperature_range_start:
                    raise ValueError(
                        f"Request {idx}: temperature_range_end must be > temperature_range_start"
                    )

                # Create parameters
                params = SimulationParameters(
                    base_tm=request.base_tm,
                    base_amplitude=request.base_amplitude,
                    ph=request.ph,
                    protein_concentration=request.protein_concentration,
                    ligand_affinity=request.ligand_affinity,
                    temperature_range=(
                        request.temperature_range_start,
                        request.temperature_range_end,
                    ),
                )

                # Simulate
                result = dsf_service.simulate_curve(params)

                results.append(
                    {
                        "index": idx,
                        "success": True,
                        "data": {
                            "temperatures": result.temperatures,
                            "ratios": result.ratios,
                            "predicted_tm": result.predicted_tm,
                        },
                    }
                )

            except Exception as e:
                results.append(
                    {
                        "index": idx,
                        "success": False,
                        "error": str(e),
                    }
                )

        successful = sum(1 for r in results if r["success"])

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Batch simulation completed: {successful}/{len(requests)} successful",
                "results": results,
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch simulation failed: {str(e)}")


@router.get("/simulate/info")
async def simulation_info() -> JSONResponse:
    """
    Get information about simulation capabilities and parameter ranges.

    Returns:
        JSON with simulation documentation
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "simulation_info": {
                "description": "Generates realistic DSF curves with physics-based parameter effects",
                "parameters": {
                    "base_tm": {
                        "description": "Base melting temperature in °C",
                        "range": [20, 100],
                        "default": 60,
                        "unit": "°C",
                    },
                    "base_amplitude": {
                        "description": "Amplitude of thermal transition (ratio units)",
                        "range": [0.05, 1.0],
                        "default": 0.3,
                    },
                    "ph": {
                        "description": "Solution pH (effect: ±0.5°C/pH unit)",
                        "range": [4.0, 10.0],
                        "default": 7.4,
                    },
                    "protein_concentration": {
                        "description": "Protein concentration (logarithmic effect on Tm)",
                        "range": [0.01, 100],
                        "default": 1.0,
                        "unit": "mg/mL",
                    },
                    "ligand_affinity": {
                        "description": "Ligand-induced Tm shift",
                        "range": [-10, 20],
                        "default": 0.0,
                        "unit": "°C",
                    },
                    "temperature_range": {
                        "description": "Temperature range for simulation",
                        "start_range": [0, 50],
                        "end_range": [40, 150],
                        "default": [20, 95],
                        "unit": "°C",
                    },
                },
                "output": {
                    "temperatures": "Array of temperatures (°C)",
                    "ratios": "F350/F330 ratios at each temperature",
                    "predicted_tm": "Effective melting temperature based on all parameters",
                },
                "physical_effects_modeled": [
                    "Cooperative sigmoidal unfolding transition",
                    "pH-dependent Tm shifts",
                    "Concentration-dependent stabilization",
                    "Ligand binding effects",
                    "Realistic experimental noise",
                ],
            },
        },
    )