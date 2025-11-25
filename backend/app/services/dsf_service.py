import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from io import BytesIO

from app.agents.parser_agent import ParserAgent
from app.agents.analysis_agent import AnalysisAgent
from app.agents.explanation_agent import ExplanationAgent

from app.models.dsf_models import (
    AnalysisResult,
    ScientificExplanation,
    SimulationResult,
    SimulationParameters,
    ResultsFilterParams,
    UploadResponse,
)



class DSFService:
    """Service orchestrating nanoDSF analysis workflow"""

    def __init__(self, storage_dir: Optional[Path] = None):
        """
        Initialize DSF service.

        Args:
            storage_dir: Directory for storing analysis results (defaults to ./data)
        """
        self.storage_dir = Path(storage_dir or "./data")
        self.storage_dir.mkdir(exist_ok=True)

        self.parser = ParserAgent(smoothing_window=11, smoothing_polyorder=3)
        self.analyzer = AnalysisAgent(prominence_threshold=0.01)
        self.explainer = ExplanationAgent()

    def analyze_file(
        self, file_bytes: BytesIO, filename: str
    ) -> tuple[AnalysisResult, ScientificExplanation, Dict[str, List[float]]]:
        """
        Complete analysis pipeline: parse → analyze → explain.

        Args:
            file_bytes: File content as BytesIO
            filename: Original filename

        Returns:
            Tuple of (AnalysisResult, ScientificExplanation, plot_data_dict)
        """
        # Parse file
        parsed_data = self.parser.parse_file(file_bytes, filename)

        # Get quality metrics
        snr, baseline_noise = self.parser.get_quality_metrics(parsed_data.smoothed_data)

        # Analyze
        metrics, quality, anomalies = self.analyzer.analyze(
            parsed_data.smoothed_data, snr, baseline_noise
        )

        # Generate explanation
        explanation = self.explainer.generate_explanation(
            parsed_data.sample_name, metrics, quality, anomalies
        )

        # Extract raw and smoothed data
        raw_temps = [d.temperature for d in parsed_data.raw_data]
        raw_ratios = [d.ratio for d in parsed_data.raw_data]
        smooth_temps = [d.temperature for d in parsed_data.smoothed_data]
        smooth_ratios = [d.ratio_smoothed for d in parsed_data.smoothed_data]
        deriv_temps = [d.temperature for d in parsed_data.smoothed_data]
        deriv_values = [d.derivative for d in parsed_data.smoothed_data]

        # Create analysis result
        result = AnalysisResult(
            sample_name=parsed_data.sample_name,
            timestamp=datetime.utcnow(),
            metrics=metrics,
            quality=quality,
            anomalies=anomalies,
            raw_temperature=raw_temps,
            raw_ratio=raw_ratios,
            smoothed_temperature=smooth_temps,
            smoothed_ratio=smooth_ratios,
            derivative_temperature=deriv_temps,
            derivative_values=deriv_values,
        )

        # Create plot data dictionary
        plot_data = {
            "raw_temperature": raw_temps,
            "raw_ratio": raw_ratios,
            "smoothed_temperature": smooth_temps,
            "smoothed_ratio": smooth_ratios,
            "derivative_temperature": deriv_temps,
            "derivative_values": deriv_values,
        }

        return result, explanation, plot_data

    def save_result(self, result: AnalysisResult) -> str:
        """
        Save analysis result to storage.

        Args:
            result: AnalysisResult to save

        Returns:
            Analysis ID
        """
        analysis_id = str(uuid.uuid4())
        result_path = self.storage_dir / f"{analysis_id}.json"

        # Convert to dict for JSON serialization
        result_dict = {
            "analysis_id": analysis_id,
            "sample_name": result.sample_name,
            "timestamp": result.timestamp.isoformat(),
            "metrics": {
                "tm": result.metrics.tm,
                "tm_confidence": result.metrics.tm_confidence,
                "onset_temperature": result.metrics.onset_temperature,
                "offset_temperature": result.metrics.offset_temperature,
                "max_slope": result.metrics.max_slope,
                "baseline_start": result.metrics.baseline_start,
                "baseline_end": result.metrics.baseline_end,
                "transition_type": result.metrics.transition_type.value,
                "num_transitions": result.metrics.num_transitions,
            },
            "quality": {
                "quality": result.quality.quality.value,
                "score": result.quality.score,
                "issues": result.quality.issues,
                "snr_estimate": result.quality.snr_estimate,
                "baseline_noise": result.quality.baseline_noise,
            },
            "anomalies": {
                "has_anomalies": result.anomalies.has_anomalies,
                "anomaly_type": result.anomalies.anomaly_type,
                "affected_temperature_range": result.anomalies.affected_temperature_range,
                "severity": result.anomalies.severity,
                "description": result.anomalies.description,
            },
            "data": {
                "raw_temperature": result.raw_temperature,
                "raw_ratio": result.raw_ratio,
                "smoothed_temperature": result.smoothed_temperature,
                "smoothed_ratio": result.smoothed_ratio,
                "derivative_temperature": result.derivative_temperature,
                "derivative_values": result.derivative_values,
            },
        }

        with open(result_path, "w") as f:
            json.dump(result_dict, f, indent=2)

        return analysis_id

    def get_result(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve stored analysis result.

        Args:
            analysis_id: ID of analysis to retrieve

        Returns:
            Analysis result dict or None if not found
        """
        result_path = self.storage_dir / f"{analysis_id}.json"

        if not result_path.exists():
            return None

        with open(result_path, "r") as f:
            return json.load(f)

    def get_results_list(
        self, filter_params: Optional[ResultsFilterParams] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve list of stored analysis results with optional filtering.

        Args:
            filter_params: Optional filtering parameters

        Returns:
            List of analysis results
        """
        results = []

        # Read all result files
        for result_file in sorted(
            self.storage_dir.glob("*.json"), reverse=True
        ):
            with open(result_file, "r") as f:
                result = json.load(f)
                results.append(result)

        # Apply filters
        if filter_params:
            results = self._apply_filters(results, filter_params)

        # Limit results
        if filter_params:
            results = results[: filter_params.limit]

        return results

    def _apply_filters(
        self, results: List[Dict[str, Any]], filter_params: ResultsFilterParams
    ) -> List[Dict[str, Any]]:
        """Apply filtering to results list"""

        filtered = results

        # Filter by sample name
        if filter_params.sample_name_contains:
            filtered = [
                r
                for r in filtered
                if filter_params.sample_name_contains.lower()
                in r["sample_name"].lower()
            ]

        # Filter by date
        if filter_params.date_from:
            filtered = [
                r
                for r in filtered
                if datetime.fromisoformat(r["timestamp"])
                >= filter_params.date_from
            ]

        if filter_params.date_to:
            filtered = [
                r
                for r in filtered
                if datetime.fromisoformat(r["timestamp"]) <= filter_params.date_to
            ]

        # Filter by quality score
        if filter_params.min_quality_score:
            filtered = [
                r
                for r in filtered
                if r["quality"]["score"] >= filter_params.min_quality_score
            ]

        return filtered

    def simulate_curve(self, params: SimulationParameters) -> SimulationResult:
        """
        Simulate DSF curve based on parameters.

        Args:
            params: Simulation parameters

        Returns:
            SimulationResult with predicted curve
        """
        import numpy as np
        from scipy.special import erf

        # Generate temperature array
        temps = np.linspace(
            params.temperature_range[0], params.temperature_range[1], 200
        )

        # Adjust Tm based on conditions
        adjusted_tm = params.base_tm + (params.ligand_affinity or 0)

        # pH effect on Tm (approximate)
        if params.ph is not None:
            ph_shift = (params.ph - 7.4) * 0.5  # ±0.5°C per pH unit
            adjusted_tm += ph_shift

        # Concentration effect (minor)
        if params.protein_concentration is not None:
            conc_shift = (
                np.log(max(params.protein_concentration, 0.1) + 0.01) * 0.2
            )
            adjusted_tm += conc_shift

        # Generate sigmoid transition curve
        amplitude = params.base_amplitude
        width = 5.0  # Temperature width of transition

        # Use error function for smooth transition
        transition = amplitude * (
            0.5 + 0.5 * erf((temps - adjusted_tm) / (width / 4))
        )

        # Add baseline (flat initially)
        baseline_start = 0.4
        baseline_end = baseline_start + amplitude * 1.2

        # Linear component
        linear_component = np.linspace(
            0, (baseline_end - baseline_start) * 0.1, len(temps)
        )

        # Combine into final ratio
        ratios = baseline_start + transition + linear_component

        # Add small realistic noise
        noise = np.random.normal(0, params.base_amplitude * 0.01, len(temps))
        ratios += noise

        # Ensure no negative values
        ratios = np.maximum(ratios, 0.01)

        return SimulationResult(
            temperatures=temps.tolist(),
            ratios=ratios.tolist(),
            predicted_tm=float(adjusted_tm),
            parameters_used=params,
        )