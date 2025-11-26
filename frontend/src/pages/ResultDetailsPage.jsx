import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import dsfApi from '../api/dsfApi'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import MetricsCard from '../components/MetricsCard'
import QualityBadge from '../components/QualityBadge'
import CurveChart from '../components/CurveChart'
import { Download, ArrowLeft } from 'lucide-react'

export default function ResultDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await dsfApi.getResultById(id)
        
        // DEFENSIVE: Handle both response structures
        // Backend might return: response.data.result OR response.data directly
        const resultData = response?.data?.result || response?.data || null
        
        if (!resultData) {
          throw new Error('Invalid response structure: no analysis data found')
        }

        setResult(resultData)
      } catch (err) {
        console.error('Failed to fetch result:', err)
        setError(err.message || 'Failed to load analysis details')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [id])

  const downloadJSON = () => {
    if (!result) return
    const dataStr = JSON.stringify(result, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analysis-${result?.sample_name || 'result'}-${result?.analysis_id || Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) return <LoadingSpinner message="Loading analysis details..." />

  if (error)
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorAlert message={error} title="Failed to Load" />
      </div>
    )

  if (!result)
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorAlert message="Analysis not found" title="Not Found" />
      </div>
    )

  // ==================== DEFENSIVE CHART DATA EXTRACTION ====================
  // Handle multiple possible data structures from backend
  // Safely extract curve data with full null-checking
  
  const prepareChartData = () => {
    try {
      // Try to find temperature array (various possible names)
      const temperatures = 
        result?.data?.raw_temperature ||
        result?.plotData?.raw_temperature ||
        result?.plot_data?.raw_temperature ||
        result?.temperatures ||
        result?.raw_data?.temperature ||
        [];

      // Try to find raw ratio array
      const rawRatios =
        result?.data?.raw_ratio ||
        result?.plotData?.raw_ratio ||
        result?.plot_data?.raw_ratio ||
        result?.raw_ratio ||
        result?.raw_data?.ratio ||
        [];

      // Try to find smoothed ratio array
      const smoothedRatios =
        result?.data?.smoothed_ratio ||
        result?.plotData?.smoothed_ratio ||
        result?.plot_data?.smoothed_ratio ||
        result?.smoothed_ratio ||
        result?.smoothed_data?.ratio ||
        [];

      // Try to find derivative array
      const derivatives =
        result?.data?.derivative_values ||
        result?.plotData?.derivative_values ||
        result?.plot_data?.derivative_values ||
        result?.derivative ||
        result?.derivative_data?.values ||
        result?.derivatives ||
        [];

      // DEFENSIVE: Ensure all arrays have same length
      const minLength = Math.min(
        temperatures?.length || 0,
        rawRatios?.length || 0,
        smoothedRatios?.length || 0,
        derivatives?.length || 0
      );

      // If no data at all, return empty array
      if (minLength === 0) {
        console.warn('No chart data found in result object')
        console.warn('Result structure:', {
          has_data: !!result?.data,
          has_plotData: !!result?.plotData,
          has_plot_data: !!result?.plot_data,
          has_raw_data: !!result?.raw_data,
          keys: Object.keys(result || {}).slice(0, 10)
        })
        return []
      }

      // Build chart data with only available entries
      const chartData = []
      for (let i = 0; i < minLength; i++) {
        const dataPoint = {
          temperature: temperatures?.[i] ?? 0,
          raw_ratio: rawRatios?.[i] ?? 0,
          smoothed_ratio: smoothedRatios?.[i] ?? 0,
          derivative: derivatives?.[i] ?? 0,
        }

        // Only add point if temperature is valid
        if (dataPoint.temperature !== null && dataPoint.temperature !== undefined) {
          chartData.push(dataPoint)
        }
      }

      return chartData
    } catch (err) {
      console.error('Error preparing chart data:', err)
      return []
    }
  }

  const chartData = prepareChartData()

  // DEFENSIVE: Get metrics with fallbacks
  const metrics = result?.metrics || {}
  const quality = result?.quality || {}
  const anomalies = result?.anomalies || {}

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (err) {
      console.warn('Failed to format date:', dateString)
      return dateString?.toString() || 'Invalid date'
    }
  }

  // DEFENSIVE: Safe access to nested properties
  const sampleName = result?.sample_name || result?.name || 'Unknown Sample'
  const timestamp = result?.timestamp || new Date().toISOString()
  const qualityLevel = quality?.quality || 'unknown'
  const qualityScore = quality?.score ?? 0
  const snrEstimate = quality?.snr_estimate ?? 0
  const baselineNoise = quality?.baseline_noise ?? 0
  const qualityIssues = quality?.issues || []
  const hasAnomalies = anomalies?.has_anomalies || false

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/results')}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-1">{sampleName}</h1>
              <p className="text-gray-400 text-sm">Analyzed on {formatDate(timestamp)}</p>
            </div>
          </div>
          <QualityBadge quality={qualityLevel} score={qualityScore} />
        </div>

        <div className="space-y-8">
          {/* Metrics */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-dark-text">Key Metrics</h2>
            <MetricsCard metrics={metrics} />
          </div>

          {/* Quality Details */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-dark-text">Quality Assessment</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Signal-to-Noise Ratio</p>
                <p className="text-3xl font-bold gradient-text">{snrEstimate.toFixed(1)}:1</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Baseline Noise</p>
                <p className="text-3xl font-bold gradient-text">{baselineNoise.toFixed(6)}</p>
              </div>
            </div>
            {qualityIssues && qualityIssues.length > 0 && (
              <div className="mt-6 pt-6 border-t border-dark-border">
                <p className="text-sm font-semibold text-yellow-400 mb-3">Quality Notes:</p>
                <ul className="text-sm text-gray-400 space-y-2">
                  {qualityIssues.map((issue, idx) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Anomalies */}
          {hasAnomalies && (
            <div className="card border-l-4 border-warning bg-orange-950 bg-opacity-20">
              <h3 className="text-lg font-semibold mb-3 text-warning">Anomalies Detected</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Type:</span> {anomalies?.anomaly_type || 'Unknown'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Severity:</span> {anomalies?.severity || 'Unknown'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Description:</span> {anomalies?.description || 'No description'}
                </p>
                {anomalies?.affected_temperature_range && (
                  <p className="text-sm">
                    <span className="font-semibold">Affected Range:</span>{' '}
                    {anomalies.affected_temperature_range[0]?.toFixed(1) || '?'}°C -{' '}
                    {anomalies.affected_temperature_range[1]?.toFixed(1) || '?'}°C
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Charts - Only render if we have data */}
          {chartData && chartData.length > 0 ? (
            <>
              <div className="card">
                <h3 className="text-lg font-semibold mb-6 text-dark-text">Thermal Transition Curve</h3>
                <CurveChart
                  data={chartData}
                  title="F350/F330 Ratio vs Temperature"
                  showDerivative={false}
                />
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-6 text-dark-text">Derivative Analysis (dRatio/dT)</h3>
                <CurveChart
                  data={chartData}
                  title="First Derivative for Tm Determination"
                  showDerivative={true}
                />
              </div>
            </>
          ) : (
            <div className="card">
              <p className="text-yellow-400 text-center py-8">
                Chart data not available. Backend response may be missing temperature/ratio arrays.
              </p>
            </div>
          )}

          {/* Scientific Explanation */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-dark-text">Scientific Interpretation</h3>

            {result?.explanation ? (
              <>
                <div className="mb-6 p-4 bg-purple-accent bg-opacity-10 rounded-lg border border-purple-accent border-opacity-30">
                  <p className="text-dark-text italic text-sm leading-relaxed">
                    {result.explanation?.summary || result.explanation}
                  </p>
                </div>

                <div className="space-y-6 text-sm">
                  {result.explanation?.detailed && (
                    <div>
                      <p className="font-semibold text-purple-light mb-3">Detailed Analysis</p>
                      <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">
                        {result.explanation.detailed}
                      </p>
                    </div>
                  )}

                  {result.explanation?.findings && result.explanation.findings.length > 0 && (
                    <div>
                      <p className="font-semibold text-purple-light mb-3">Key Findings</p>
                      <ul className="text-gray-400 space-y-2">
                        {result.explanation.findings.map((finding, idx) => (
                          <li key={idx}>• {finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.explanation?.recommendations && result.explanation.recommendations.length > 0 && (
                    <div>
                      <p className="font-semibold text-purple-light mb-3">Recommendations</p>
                      <ul className="text-gray-400 space-y-2">
                        {result.explanation.recommendations.map((rec, idx) => (
                          <li key={idx}>✓ {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No explanation available for this analysis.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/analyze')}
              className="btn-secondary flex-1"
            >
              Analyze New File
            </button>
            <button
              onClick={downloadJSON}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}