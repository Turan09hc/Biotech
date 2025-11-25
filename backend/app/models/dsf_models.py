from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class CurveQuality(str, Enum):
    """Enum for curve quality assessment"""
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"
    INVALID = "invalid"


class TransitionType(str, Enum):
    """Types of detected transitions"""
    MONOPHASIC = "monophasic"
    BIPHASIC = "biphasic"
    MULTIPHASIC = "multiphasic"


class RawDataPoint(BaseModel):
    """Single raw data point from nanoDSF"""
    temperature: float = Field(..., description="Temperature in Celsius")
    f330: float = Field(..., description="Fluorescence at 330nm")
    f350: float = Field(..., description="Fluorescence at 350nm")
    ratio: float = Field(..., description="F350/F330 ratio")


class SmoothedDataPoint(BaseModel):
    """Smoothed data point"""
    temperature: float
    f330_smoothed: float
    f350_smoothed: float
    ratio_smoothed: float
    derivative: float = Field(default=0.0, description="dRatio/dT")


class CurveMetrics(BaseModel):
    """Computed metrics from curve analysis"""
    tm: float = Field(..., description="Melting temperature (°C)")
    tm_confidence: float = Field(..., description="Confidence in Tm (0-1)")
    onset_temperature: float = Field(..., description="Temperature where curve starts rising")
    offset_temperature: float = Field(..., description="Temperature where curve plateaus")
    max_slope: float = Field(..., description="Maximum dRatio/dT value")
    baseline_start: float = Field(..., description="Ratio at start of curve")
    baseline_end: float = Field(..., description="Ratio at end of curve")
    transition_type: TransitionType = Field(..., description="Type of transition detected")
    num_transitions: int = Field(..., description="Number of detected transitions")


class AnomalyDetection(BaseModel):
    """Anomaly detection results"""
    has_anomalies: bool
    anomaly_type: Optional[str] = None
    affected_temperature_range: Optional[tuple[float, float]] = None
    severity: Optional[str] = None
    description: Optional[str] = None


class CurveQualityAssessment(BaseModel):
    """Assessment of curve quality"""
    quality: CurveQuality
    score: float = Field(..., description="Quality score 0-100")
    issues: List[str] = Field(default_factory=list)
    snr_estimate: float = Field(..., description="Signal-to-noise ratio estimate")
    baseline_noise: float = Field(..., description="Estimated baseline noise level")


class ParsedDSFData(BaseModel):
    """Parsed nanoDSF data from file"""
    sample_name: str
    raw_data: List[RawDataPoint]
    smoothed_data: List[SmoothedDataPoint]
    temperature_range: tuple[float, float]
    data_points_count: int


class AnalysisResult(BaseModel):
    """Complete analysis result"""
    sample_name: str
    timestamp: datetime
    metrics: CurveMetrics
    quality: CurveQualityAssessment
    anomalies: AnomalyDetection
    raw_temperature: List[float]
    raw_ratio: List[float]
    smoothed_temperature: List[float]
    smoothed_ratio: List[float]
    derivative_temperature: List[float]
    derivative_values: List[float]


class ScientificExplanation(BaseModel):
    """Generated scientific explanation"""
    summary: str = Field(..., description="Brief 2-3 sentence summary")
    detailed_explanation: str = Field(..., description="Detailed scientific explanation")
    key_findings: List[str] = Field(..., description="List of key findings")
    recommendations: List[str] = Field(..., description="Recommendations for further analysis")
    quality_concerns: List[str] = Field(default_factory=list)


class UploadResponse(BaseModel):
    """Response from file upload endpoint"""
    success: bool
    message: str
    analysis_id: str
    sample_name: str
    metrics: CurveMetrics
    quality: CurveQualityAssessment
    explanation: ScientificExplanation
    plot_data: Dict[str, List[float]]


class SimulationParameters(BaseModel):
    """Parameters for DSF simulation"""
    base_tm: float = Field(..., description="Base Tm in Celsius")
    base_amplitude: float = Field(default=0.3, description="Baseline amplitude of transition")
    ph: Optional[float] = Field(default=7.4, description="pH value")
    protein_concentration: Optional[float] = Field(default=1.0, description="Protein concentration (mg/mL)")
    ligand_affinity: Optional[float] = Field(default=0.0, description="Ligand affinity (ΔTm shift)")
    temperature_range: tuple[float, float] = Field(default=(20, 95), description="Temperature range (°C)")


class SimulationResult(BaseModel):
    """Simulated DSF curve"""
    temperatures: List[float]
    ratios: List[float]
    predicted_tm: float
    parameters_used: SimulationParameters


class ResultsFilterParams(BaseModel):
    """Parameters for filtering previous results"""
    sample_name_contains: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_quality_score: Optional[float] = Field(default=0, ge=0, le=100)
    limit: int = Field(default=50, ge=1, le=500)