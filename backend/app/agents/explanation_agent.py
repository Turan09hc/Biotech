from app.models.dsf_models import (
    CurveMetrics,
    CurveQualityAssessment,
    AnomalyDetection,
    ScientificExplanation,
    TransitionType,
    CurveQuality,
)



class ExplanationAgent:
    """Agent responsible for generating scientific explanations of DSF analysis"""

    def generate_explanation(
        self,
        sample_name: str,
        metrics: CurveMetrics,
        quality: CurveQualityAssessment,
        anomalies: AnomalyDetection,
    ) -> ScientificExplanation:
        """
        Generate comprehensive scientific explanation of analysis results.

        Args:
            sample_name: Name of the sample
            metrics: Computed curve metrics
            quality: Quality assessment
            anomalies: Anomaly detection results

        Returns:
            ScientificExplanation object
        """

        summary = self._generate_summary(sample_name, metrics, quality)
        detailed = self._generate_detailed_explanation(
            metrics, quality, anomalies
        )
        findings = self._extract_key_findings(metrics, quality, anomalies)
        recommendations = self._generate_recommendations(
            metrics, quality, anomalies
        )
        concerns = self._identify_quality_concerns(quality, anomalies)

        return ScientificExplanation(
            summary=summary,
            detailed_explanation=detailed,
            key_findings=findings,
            recommendations=recommendations,
            quality_concerns=concerns,
        )

    def _generate_summary(
        self, sample_name: str, metrics: CurveMetrics, quality: CurveQualityAssessment
    ) -> str:
        """Generate brief 2-3 sentence summary"""

        quality_text = {
            CurveQuality.EXCELLENT: "excellent quality",
            CurveQuality.GOOD: "good quality",
            CurveQuality.ACCEPTABLE: "acceptable quality",
            CurveQuality.POOR: "poor quality",
            CurveQuality.INVALID: "invalid",
        }[quality.quality]

        transition_text = {
            TransitionType.MONOPHASIC: "a single sharp transition",
            TransitionType.BIPHASIC: "two distinct transitions",
            TransitionType.MULTIPHASIC: "multiple transitions",
        }[metrics.transition_type]

        summary = (
            f"The nanoDSF analysis of {sample_name} shows {transition_text} "
            f"with a melting temperature (Tm) of {metrics.tm:.2f}°C. "
            f"The curve exhibits {quality_text} with a quality score of {quality.score:.1f}/100."
        )

        return summary

    def _generate_detailed_explanation(
        self,
        metrics: CurveMetrics,
        quality: CurveQualityAssessment,
        anomalies: AnomalyDetection,
    ) -> str:
        """Generate detailed scientific explanation"""

        parts = []

        # Thermal stability section
        parts.append(
            f"**Thermal Stability Profile:**\n"
            f"The protein exhibits a melting temperature (Tm) of {metrics.tm:.2f}°C "
            f"(confidence: {metrics.tm_confidence*100:.1f}%), indicating the midpoint of the thermal "
            f"unfolding transition. The transition onset occurs at {metrics.onset_temperature:.2f}°C "
            f"and completes by {metrics.offset_temperature:.2f}°C, spanning a "
            f"{metrics.offset_temperature - metrics.onset_temperature:.2f}°C temperature range.\n"
        )

        # Transition kinetics
        parts.append(
            f"**Transition Kinetics:**\n"
            f"The maximum transition rate (dF/dT) is {metrics.max_slope:.6f} ratio units per °C, "
            f"indicating a {'sharp and cooperative' if metrics.max_slope > 0.01 else 'gradual and non-cooperative'} "
            f"unfolding process. "
            f"The {metrics.transition_type.value} transition pattern suggests "
            f"{'a single folded-to-unfolded state transition' if metrics.num_transitions == 1 else f'{metrics.num_transitions} distinct thermal events'}.\n"
        )

        # Fluorescence data
        parts.append(
            f"**Fluorescence Changes:**\n"
            f"The F350/F330 ratio increases from {metrics.baseline_start:.4f} at the start "
            f"to {metrics.baseline_end:.4f} at the end of the transition, reflecting the exposure of "
            f"tryptophan residues during protein unfolding. This change of {metrics.baseline_end - metrics.baseline_start:.4f} units "
            f"indicates {'significant' if abs(metrics.baseline_end - metrics.baseline_start) > 0.1 else 'modest'} "
            f"structural rearrangement.\n"
        )

        # Quality assessment
        parts.append(
            f"**Data Quality Assessment:**\n"
            f"The curve quality is rated as {quality.quality.value} with a score of {quality.score:.1f}/100. "
            f"Signal-to-noise ratio is {quality.snr_estimate:.1f}:1, and baseline noise is estimated at "
            f"{quality.baseline_noise:.6f} ratio units. "
        )

        if quality.issues:
            parts[-1] += f"Quality concerns include: {', '.join(quality.issues)}.\n"
        else:
            parts[-1] += "No significant quality issues detected.\n"

        # Anomalies
        if anomalies.has_anomalies:
            parts.append(
                f"**Anomalies Detected:**\n"
                f"Anomaly type: {anomalies.anomaly_type}. "
                f"Severity: {anomalies.severity}. "
                f"Description: {anomalies.description}. "
                f"Affected temperature range: {anomalies.affected_temperature_range[0]:.1f}°C - "
                f"{anomalies.affected_temperature_range[1]:.1f}°C.\n"
            )

        return "\n".join(parts)

    def _extract_key_findings(
        self,
        metrics: CurveMetrics,
        quality: CurveQualityAssessment,
        anomalies: AnomalyDetection,
    ) -> list[str]:
        """Extract key findings from analysis"""

        findings = []

        # Tm finding
        if metrics.tm_confidence > 0.8:
            findings.append(
                f"High-confidence Tm determination at {metrics.tm:.2f}°C"
            )
        elif metrics.tm_confidence > 0.6:
            findings.append(
                f"Moderate-confidence Tm determination at {metrics.tm:.2f}°C"
            )
        else:
            findings.append(
                f"Low-confidence Tm at {metrics.tm:.2f}°C - results should be verified"
            )

        # Transition type
        if metrics.transition_type == TransitionType.MONOPHASIC:
            findings.append(
                "Monophasic transition indicates cooperative two-state unfolding"
            )
        elif metrics.transition_type == TransitionType.BIPHASIC:
            findings.append(
                "Biphasic transition suggests multi-domain unfolding or domain interactions"
            )
        else:
            findings.append(
                f"Complex unfolding with {metrics.num_transitions} distinct thermal events"
            )

        # Thermal range
        temp_width = metrics.offset_temperature - metrics.onset_temperature
        if temp_width < 5:
            findings.append("Narrow thermal transition width suggests cooperative unfolding")
        elif temp_width > 15:
            findings.append("Broad thermal transition indicates gradual, non-cooperative unfolding")

        # Data quality
        if quality.quality == CurveQuality.EXCELLENT:
            findings.append("High-quality data suitable for detailed structural interpretation")
        elif quality.quality in [CurveQuality.GOOD, CurveQuality.ACCEPTABLE]:
            findings.append("Adequate data quality for Tm determination")
        else:
            findings.append(
                "Poor data quality - caution advised in interpretation"
            )

        # Anomalies
        if anomalies.has_anomalies:
            findings.append(f"Anomaly detected: {anomalies.anomaly_type}")

        return findings

    def _generate_recommendations(
        self,
        metrics: CurveMetrics,
        quality: CurveQualityAssessment,
        anomalies: AnomalyDetection,
    ) -> list[str]:
        """Generate recommendations based on analysis"""

        recommendations = []

        # Based on Tm confidence
        if metrics.tm_confidence < 0.7:
            recommendations.append(
                "Repeat measurement with optimized experimental conditions for more reliable Tm determination"
            )

        # Based on quality
        if quality.quality == CurveQuality.POOR or quality.quality == CurveQuality.INVALID:
            recommendations.append(
                "Investigate experimental protocol; high noise suggests instrument, sample, or buffer issues"
            )

        if "Low signal-to-noise ratio" in quality.issues:
            recommendations.append(
                "Increase protein concentration or optimize instrument settings to improve SNR"
            )

        if "Too few data points" in quality.issues:
            recommendations.append(
                "Collect more data points across the thermal transition for better curve resolution"
            )

        if "Temperature range too narrow" in quality.issues:
            recommendations.append(
                "Extend temperature range (recommend 25-95°C) to capture full unfolding profile"
            )

        # Based on transition type
        if metrics.transition_type == TransitionType.BIPHASIC:
            recommendations.append(
                "Perform complementary techniques (CD, SAXS) to characterize multi-domain unfolding"
            )

        if metrics.transition_type == TransitionType.MULTIPHASIC:
            recommendations.append(
                "Consider thermal denaturation followed by mass spectrometry for detailed structural insights"
            )

        # Based on anomalies
        if anomalies.has_anomalies and anomalies.severity == "high":
            recommendations.append(
                "Review raw data and experimental conditions; consider re-running measurement"
            )

        # General recommendations
        recommendations.append(
            "Use this Tm as baseline for thermal stability assays (pH, ligand binding, mutations)"
        )
        recommendations.append(
            "Compare Tm to literature values for the same protein to validate results"
        )

        return recommendations if recommendations else ["Measurement complete. Results appear valid."]

    def _identify_quality_concerns(
        self,
        quality: CurveQualityAssessment,
        anomalies: AnomalyDetection,
    ) -> list[str]:
        """Identify and list quality concerns"""

        concerns = quality.issues.copy()

        if anomalies.has_anomalies:
            concerns.append(
                f"Anomaly detected ({anomalies.anomaly_type}): {anomalies.description}"
            )

        if quality.snr_estimate < 3:
            concerns.append(
                "Signal-to-noise ratio is suboptimal; consider sample or instrument optimization"
            )

        if quality.quality in [CurveQuality.POOR, CurveQuality.INVALID]:
            concerns.append(
                "Overall curve quality is compromised; results should be verified with additional measurements"
            )

        return concerns