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
        setResult(response.data.result)
      } catch (err) {
        setError(err.message)
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
    link.download = `analysis-${result.sample_name}-${result.analysis_id}.json`
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

  // Prepare chart data
  const chartData = result.data
    ? result.data.raw_temperature.map((temp, idx) => ({
        temperature: temp,
        raw_ratio: result.data.raw_ratio[idx],
        smoothed_ratio: result.data.smoothed_ratio[idx],
        derivative: result.data.derivative_values[idx],
      }))
    : []

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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
              <h1 className="text-4xl font-bold gradient-text mb-1">{result.sample_name}</h1>
              <p className="text-gray-400 text-sm">Analyzed on {formatDate(result.timestamp)}</p>
            </div>
          </div>
          <QualityBadge quality={result.quality.quality} score={result.quality.score} />
        </div>

        <div className="space-y-8">
          {/* Metrics */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-dark-text">Key Metrics</h2>
            <MetricsCard metrics={result.metrics} />
          </div>

          {/* Quality Details */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-dark-text">Quality Assessment</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Signal-to-Noise Ratio</p>
                <p className="text-3xl font-bold gradient-text">{result.quality.snr_estimate.toFixed(1)}:1</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Baseline Noise</p>
                <p className="text-3xl font-bold gradient-text">{result.quality.baseline_noise.toFixed(6)}</p>
              </div>
            </div>
            {result.quality.issues.length > 0 && (
              <div className="mt-6 pt-6 border-t border-dark-border">
                <p className="text-sm font-semibold text-yellow-400 mb-3">Quality Notes:</p>
                <ul className="text-sm text-gray-400 space-y-2">
                  {result.quality.issues.map((issue, idx) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Anomalies */}
          {result.anomalies?.has_anomalies && (
            <div className="card border-l-4 border-warning bg-orange-950 bg-opacity-20">
              <h3 className="text-lg font-semibold mb-3 text-warning">Anomalies Detected</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Type:</span> {result.anomalies.anomaly_type}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Severity:</span> {result.anomalies.severity}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Description:</span> {result.anomalies.description}
                </p>
                {result.anomalies.affected_temperature_range && (
                  <p className="text-sm">
                    <span className="font-semibold">Affected Range:</span>{' '}
                    {result.anomalies.affected_temperature_range[0].toFixed(1)}°C -{' '}
                    {result.anomalies.affected_temperature_range[1].toFixed(1)}°C
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Charts */}
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

          {/* Scientific Explanation */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-dark-text">Scientific Interpretation</h3>

            <div className="mb-6 p-4 bg-purple-accent bg-opacity-10 rounded-lg border border-purple-accent border-opacity-30">
              <p className="text-dark-text italic text-sm leading-relaxed">{result.metrics}</p>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <p className="font-semibold text-purple-light mb-3">Detailed Analysis</p>
                <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">{result.metrics?.toString()}</p>
              </div>
            </div>
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