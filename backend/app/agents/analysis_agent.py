import numpy as np
from typing import List, Tuple, Optional
from scipy.signal import find_peaks, peak_prominences
from scipy.interpolate import UnivariateSpline

from app.models.dsf_models import (
    SmoothedDataPoint,
    CurveMetrics,
    CurveQualityAssessment,
    CurveQuality,
    AnomalyDetection,
    TransitionType,
)



class AnalysisAgent:
    """Agent responsible for analyzing nanoDSF curves"""

    def __init__(self, prominence_threshold: float = 0.01):
        """
        Initialize analysis agent.

        Args:
            prominence_threshold: Peak prominence threshold for transition detection
        """
        self.prominence_threshold = prominence_threshold

    def analyze(
        self, smoothed_data: List[SmoothedDataPoint], snr: float, baseline_noise: float
    ) -> Tuple[CurveMetrics, CurveQualityAssessment, AnomalyDetection]:
        """
        Perform complete curve analysis.

        Args:
            smoothed_data: List of smoothed data points
            snr: Signal-to-noise ratio
            baseline_noise: Baseline noise estimate

        Returns:
            Tuple of (metrics, quality_assessment, anomaly_detection)
        """
        temps = np.array([d.temperature for d in smoothed_data])
        ratios = np.array([d.ratio_smoothed for d in smoothed_data])
        derivatives = np.array([d.derivative for d in smoothed_data])

        # Detect anomalies first
        anomalies = self._detect_anomalies(temps, ratios, derivatives, baseline_noise)

        # Compute metrics
        metrics = self._compute_metrics(temps, ratios, derivatives)

        # Assess quality
        quality = self._assess_quality(temps, ratios, derivatives, snr, baseline_noise)

        return metrics, quality, anomalies

    def _compute_metrics(
        self, temps: np.ndarray, ratios: np.ndarray, derivatives: np.ndarray
    ) -> CurveMetrics:
        """Compute melting temperature and curve metrics"""

        # Find Tm from maximum derivative
        max_deriv_idx = np.argmax(np.abs(derivatives))
        tm = float(temps[max_deriv_idx])
        tm_confidence = self._estimate_tm_confidence(derivatives, max_deriv_idx)

        # Find onset and offset temperatures
        # Onset: where curve starts rising significantly (10% of max slope)
        max_slope = np.max(np.abs(derivatives))
        threshold = max_slope * 0.1

        onset_indices = np.where(np.abs(derivatives) > threshold)[0]
        if len(onset_indices) > 0:
            onset_temperature = float(temps[onset_indices[0]])
        else:
            onset_temperature = float(temps[0])

        offset_indices = np.where(np.abs(derivatives) > threshold)[0]
        if len(offset_indices) > 0:
            offset_temperature = float(temps[offset_indices[-1]])
        else:
            offset_temperature = float(temps[-1])

        # Baselines
        baseline_start = float(np.mean(ratios[:5]))
        baseline_end = float(np.mean(ratios[-5:]))

        # Detect transitions
        transition_type, num_transitions = self._detect_transitions(
            temps, derivatives
        )

        metrics = CurveMetrics(
            tm=tm,
            tm_confidence=tm_confidence,
            onset_temperature=onset_temperature,
            offset_temperature=offset_temperature,
            max_slope=float(max_slope),
            baseline_start=baseline_start,
            baseline_end=baseline_end,
            transition_type=transition_type,
            num_transitions=num_transitions,
        )

        return metrics

    def _estimate_tm_confidence(
        self, derivatives: np.ndarray, tm_idx: int
    ) -> float:
        """
        Estimate confidence in Tm determination.
        Higher confidence if peak is sharp and well-defined.
        """
        max_deriv = np.abs(derivatives[tm_idx])
        if max_deriv < 1e-6:
            return 0.0

        # Look at width of peak
        threshold = max_deriv * 0.5
        above_threshold = np.where(np.abs(derivatives) > threshold)[0]

        if len(above_threshold) == 0:
            return 0.1

        peak_width = above_threshold[-1] - above_threshold[0]
        # Narrower peaks = higher confidence
        confidence = 1.0 / (1.0 + peak_width / 10.0)

        # Apply second derivative sharpness
        if len(derivatives) > 2:
            second_deriv = np.gradient(derivatives)
            sharpness = np.abs(second_deriv[tm_idx])
            confidence *= min(1.0, sharpness / 0.01)

        return float(max(0.0, min(1.0, confidence)))

    def _detect_transitions(
        self, temps: np.ndarray, derivatives: np.ndarray
    ) -> Tuple[TransitionType, int]:
        """
        Detect number and type of transitions in the curve.

        Returns:
            Tuple of (TransitionType, number of transitions)
        """
        # Find peaks in absolute derivative
        abs_deriv = np.abs(derivatives)

        # Normalize for peak detection
        if np.max(abs_deriv) > 0:
            normalized = abs_deriv / np.max(abs_deriv)
        else:
            return TransitionType.MONOPHASIC, 1

        peaks, properties = find_peaks(normalized, height=0.3, distance=5)

        if len(peaks) == 0:
            return TransitionType.MONOPHASIC, 1
        elif len(peaks) == 1:
            return TransitionType.MONOPHASIC, 1
        elif len(peaks) == 2:
            return TransitionType.BIPHASIC, 2
        else:
            return TransitionType.MULTIPHASIC, len(peaks)

    def _assess_quality(
        self,
        temps: np.ndarray,
        ratios: np.ndarray,
        derivatives: np.ndarray,
        snr: float,
        baseline_noise: float,
    ) -> CurveQualityAssessment:
        """Assess overall curve quality"""

        issues = []
        score = 100.0

        # Check data range
        if len(temps) < 20:
            issues.append("Too few data points")
            score -= 20

        # Check temperature range
        temp_range = temps[-1] - temps[0]
        if temp_range < 30:
            issues.append("Temperature range too narrow (<30°C)")
            score -= 15

        # Check signal-to-noise ratio
        if snr < 2:
            issues.append("Low signal-to-noise ratio")
            score -= 25
        elif snr < 5:
            issues.append("Moderate SNR")
            score -= 10

        # Check baseline flatness
        baseline_start = np.mean(ratios[:5])
        baseline_end = np.mean(ratios[-5:])
        baseline_var = np.std(
            [baseline_start, baseline_end]
        )  # Variance between start/end

        if baseline_var > baseline_noise * 3:
            issues.append("Sloped baseline")
            score -= 10

        # Check for plateaus
        low_deriv_mask = np.abs(derivatives) < np.percentile(np.abs(derivatives), 30)
        if np.sum(low_deriv_mask) < len(derivatives) * 0.3:
            issues.append("Poorly defined baseline regions")
            score -= 10

        # Check transition sharpness
        max_deriv = np.max(np.abs(derivatives))
        if max_deriv < 0.001:
            issues.append("Very shallow transition")
            score -= 20

        # Determine overall quality
        score = max(0, min(100, score))

        if score >= 85:
            quality = CurveQuality.EXCELLENT
        elif score >= 70:
            quality = CurveQuality.GOOD
        elif score >= 55:
            quality = CurveQuality.ACCEPTABLE
        elif score >= 40:
            quality = CurveQuality.POOR
        else:
            quality = CurveQuality.INVALID

        return CurveQualityAssessment(
            quality=quality,
            score=float(score),
            issues=issues,
            snr_estimate=float(snr),
            baseline_noise=float(baseline_noise),
        )

    def _detect_anomalies(
        self,
        temps: np.ndarray,
        ratios: np.ndarray,
        derivatives: np.ndarray,
        baseline_noise: float,
    ) -> AnomalyDetection:
        """Detect anomalies in the curve"""

        # Check for outliers using zscore
        z_scores = np.abs((ratios - np.mean(ratios)) / (np.std(ratios) + 1e-6))
        outlier_threshold = 3.5  # 3.5 sigma

        outliers = np.where(z_scores > outlier_threshold)[0]

        if len(outliers) > 0:
            outlier_temps = temps[outliers]
            return AnomalyDetection(
                has_anomalies=True,
                anomaly_type="outliers",
                affected_temperature_range=(
                    float(np.min(outlier_temps)),
                    float(np.max(outlier_temps)),
                ),
                severity="medium" if len(outliers) < 3 else "high",
                description=f"Found {len(outliers)} outlier points in fluorescence data",
            )

        # Check for baseline drift
        baseline_start = np.mean(ratios[:5])
        baseline_end = np.mean(ratios[-5:])
        drift = abs(baseline_end - baseline_start)

        if drift > baseline_noise * 5:
            return AnomalyDetection(
                has_anomalies=True,
                anomaly_type="baseline_drift",
                affected_temperature_range=(float(temps[0]), float(temps[-1])),
                severity="low",
                description=f"Significant baseline drift detected (Δratio={drift:.4f})",
            )

        # Check for discontinuities
        ratio_diffs = np.abs(np.diff(ratios))
        expected_max_diff = np.percentile(ratio_diffs, 95)

        discontinuities = np.where(ratio_diffs > expected_max_diff * 3)[0]

        if len(discontinuities) > 0:
            return AnomalyDetection(
                has_anomalies=True,
                anomaly_type="discontinuity",
                affected_temperature_range=(
                    float(temps[discontinuities[0]]),
                    float(temps[discontinuities[0] + 1]),
                ),
                severity="high",
                description="Discontinuous jumps detected in fluorescence data",
            )

        return AnomalyDetection(has_anomalies=False)