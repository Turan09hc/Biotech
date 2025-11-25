import pandas as pd
import numpy as np
from typing import Tuple, List
from pathlib import Path
from scipy.signal import savgol_filter
from io import BytesIO

from app.models.dsf_models import (
    RawDataPoint,
    SmoothedDataPoint,
    ParsedDSFData,
)



class ParserAgent:
    """Agent responsible for parsing nanoDSF data files and extracting parameters"""

    def __init__(self, smoothing_window: int = 11, smoothing_polyorder: int = 3):
        """
        Initialize parser agent.

        Args:
            smoothing_window: Window size for Savitzky-Golay filter (must be odd)
            smoothing_polyorder: Polynomial order for smoothing
        """
        # Ensure smoothing_window is odd
        if smoothing_window % 2 == 0:
            smoothing_window += 1

        self.smoothing_window = smoothing_window
        self.smoothing_polyorder = smoothing_polyorder

    def parse_file(self, file_path_or_bytes: any, filename: str) -> ParsedDSFData:
        """
        Parse CSV or XLSX nanoDSF data file.

        Args:
            file_path_or_bytes: Path to file or BytesIO object
            filename: Original filename (to determine format)

        Returns:
            ParsedDSFData object with raw and smoothed data
        """
        # Determine file type and read
        if isinstance(file_path_or_bytes, (str, Path)):
            df = self._read_file(file_path_or_bytes)
        elif isinstance(file_path_or_bytes, BytesIO):
            if filename.endswith(".xlsx") or filename.endswith(".xls"):
                df = pd.read_excel(file_path_or_bytes)
            elif filename.endswith(".csv"):
                df = pd.read_csv(file_path_or_bytes)
            else:
                raise ValueError(f"Unsupported file format: {filename}")
        else:
            raise TypeError("file_path_or_bytes must be str, Path, or BytesIO")

        # Extract sample name from filename
        sample_name = Path(filename).stem

        # Standardize column names
        df = self._standardize_columns(df)

        # Extract raw data
        raw_data = self._extract_raw_data(df)

        # Smooth data
        smoothed_data = self._smooth_data(raw_data)

        # Get temperature range
        temps = [d.temperature for d in raw_data]
        temp_range = (min(temps), max(temps))

        return ParsedDSFData(
            sample_name=sample_name,
            raw_data=raw_data,
            smoothed_data=smoothed_data,
            temperature_range=temp_range,
            data_points_count=len(raw_data),
        )

    def _read_file(self, file_path: Path) -> pd.DataFrame:
        """Read CSV or XLSX file"""
        file_path = Path(file_path)

        if file_path.suffix.lower() == ".xlsx" or file_path.suffix.lower() == ".xls":
            return pd.read_excel(file_path)
        elif file_path.suffix.lower() == ".csv":
            return pd.read_csv(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")

    def _standardize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Standardize column names to expected format.
        Looks for temperature, F330, F350 columns (case-insensitive).
        """
        df_lower = df.copy()
        df_lower.columns = df_lower.columns.str.lower().str.strip()

        # Map common column name variations
        column_mapping = {}

        # Temperature column
        temp_cols = [col for col in df_lower.columns if "temp" in col or "t(" in col]
        if temp_cols:
            column_mapping[temp_cols[0]] = "temperature"

        # F330 column
        f330_cols = [col for col in df_lower.columns if "330" in col or "f330" in col]
        if f330_cols:
            column_mapping[f330_cols[0]] = "f330"

        # F350 column
        f350_cols = [col for col in df_lower.columns if "350" in col or "f350" in col]
        if f350_cols:
            column_mapping[f350_cols[0]] = "f350"

        df_lower = df_lower.rename(columns=column_mapping)

        required_cols = ["temperature", "f330", "f350"]
        missing = [col for col in required_cols if col not in df_lower.columns]
        if missing:
            raise ValueError(
                f"Missing required columns: {missing}. "
                f"Available columns: {list(df_lower.columns)}"
            )

        return df_lower[required_cols].copy()

    def _extract_raw_data(self, df: pd.DataFrame) -> List[RawDataPoint]:
        """Extract raw data points from dataframe"""
        raw_data = []

        for _, row in df.iterrows():
            try:
                temp = float(row["temperature"])
                f330 = float(row["f330"])
                f350 = float(row["f350"])

                # Prevent division by zero
                if f330 == 0:
                    f330 = 1e-6

                ratio = f350 / f330

                raw_data.append(
                    RawDataPoint(
                        temperature=temp, f330=f330, f350=f350, ratio=ratio
                    )
                )
            except (ValueError, TypeError) as e:
                # Skip rows with invalid data
                continue

        if not raw_data:
            raise ValueError("No valid data points extracted from file")

        # Sort by temperature
        raw_data.sort(key=lambda x: x.temperature)

        return raw_data

    def _smooth_data(self, raw_data: List[RawDataPoint]) -> List[SmoothedDataPoint]:
        """
        Smooth fluorescence data using Savitzky-Golay filter.
        Also compute first derivative for Tm determination.
        """
        n_points = len(raw_data)

        # Adjust smoothing window if data is too sparse
        window = min(self.smoothing_window, n_points - 2)
        if window % 2 == 0:
            window -= 1
        if window < 3:
            window = 3

        # Extract arrays
        temps = np.array([d.temperature for d in raw_data])
        f330_raw = np.array([d.f330 for d in raw_data])
        f350_raw = np.array([d.f350 for d in raw_data])
        ratios_raw = np.array([d.ratio for d in raw_data])

        # Apply Savitzky-Golay filter
        f330_smooth = savgol_filter(f330_raw, window, self.smoothing_polyorder)
        f350_smooth = savgol_filter(f350_raw, window, self.smoothing_polyorder)
        ratio_smooth = savgol_filter(ratios_raw, window, self.smoothing_polyorder)

        # Compute derivatives using smoothed data
        derivatives = np.gradient(ratio_smooth, temps)

        # Create smoothed data points
        smoothed_data = []
        for i, raw_point in enumerate(raw_data):
            smoothed_data.append(
                SmoothedDataPoint(
                    temperature=raw_point.temperature,
                    f330_smoothed=float(f330_smooth[i]),
                    f350_smoothed=float(f350_smooth[i]),
                    ratio_smoothed=float(ratio_smooth[i]),
                    derivative=float(derivatives[i]),
                )
            )

        return smoothed_data

    def get_quality_metrics(
        self, smoothed_data: List[SmoothedDataPoint]
    ) -> Tuple[float, float]:
        """
        Estimate signal-to-noise ratio and baseline noise.

        Args:
            smoothed_data: List of smoothed data points

        Returns:
            Tuple of (SNR estimate, baseline noise estimate)
        """
        ratios = np.array([d.ratio_smoothed for d in smoothed_data])
        derivatives = np.array([d.derivative for d in smoothed_data])

        # Estimate noise from derivatives in plateau region (low derivative)
        low_deriv_mask = np.abs(derivatives) < np.percentile(np.abs(derivatives), 20)
        if np.any(low_deriv_mask):
            baseline_noise = np.std(np.diff(ratios[low_deriv_mask]))
        else:
            baseline_noise = np.std(np.diff(ratios)) * 0.1

        # SNR from max derivative vs baseline noise
        max_slope = np.max(np.abs(derivatives))
        snr = max_slope / (baseline_noise + 1e-6)

        return float(snr), float(baseline_noise)