import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dsfApi from '../api/dsfApi'
import FileUploader from '../components/FileUploader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import MetricsCard from '../components/MetricsCard'
import QualityBadge from '../components/QualityBadge'
import CurveChart from '../components/CurveChart'
import { Download, Home } from 'lucide-react'

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setError(null)
    setResult(null)
  }

  const handleAnalyze = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const response = await dsfApi.uploadFile(file)
      setResult(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadJSON = () => {
    if (!result) return
    const dataStr = JSON.stringify(result, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analysis-${result.sample_name}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Prepare chart data
  const chartData = result?.plot_data
    ? result.plot_data.raw_temperature.map((temp, idx) => ({
        temperature: temp,
        raw_ratio: result.plot_data.raw_ratio[idx],
        smoothed_ratio: result.plot_data.smoothed_ratio[idx],
        derivative: result.plot_data.derivative_values[idx],
      }))
    : []

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Analyze nanoDSF Data</h1>
            <p className="text-gray-400">Upload a CSV or XLSX file to get started</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {!result ? (
          <div className="max-w-2xl mx-auto">
            <FileUploader onFileSelect={handleFileSelect} disabled={loading} />

            {file && (
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Analyze File'}
                </button>
                <button
                  onClick={() => {
                    setFile(null)
                    setResult(null)
                  }}
                  className="btn-secondary"
                >
                  Clear
                </button>
              </div>
            )}

            {loading && <LoadingSpinner message="Analyzing your nanoDSF data..." />}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Sample Info */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-dark-text mb-2">{result.sample_name}</h2>
                  <p className="text-gray-400">Analysis completed successfully</p>
                </div>
                <QualityBadge quality={result.quality.quality} score={result.quality.score} />
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-dark-text">Key Metrics</h3>
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
              <h3 className="text-lg font-semibold mb-4 text-dark-text">Scientific Explanation</h3>

              <div className="mb-6 p-4 bg-purple-accent bg-opacity-10 rounded-lg border border-purple-accent border-opacity-30">
                <p className="text-dark-text italic">{result.explanation.summary}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-purple-light mb-3">Detailed Analysis</p>
                  <p className="text-sm text-gray-400 whitespace-pre-wrap">{result.explanation.detailed_explanation}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-purple-light mb-3">Key Findings</p>
                  <ul className="space-y-2">
                    {result.explanation.key_findings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex gap-3">
                        <span className="text-purple-accent">→</span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-purple-light mb-3">Recommendations</p>
                  <ul className="space-y-2">
                    {result.explanation.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex gap-3">
                        <span className="text-success">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {result.explanation.quality_concerns.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-warning mb-3">Quality Concerns</p>
                    <ul className="space-y-2">
                      {result.explanation.quality_concerns.map((concern, idx) => (
                        <li key={idx} className="text-sm text-yellow-400 flex gap-3">
                          <span>⚠</span>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setFile(null)
                  setResult(null)
                }}
                className="btn-secondary flex-1"
              >
                Analyze Another File
              </button>
              <button
                onClick={downloadJSON}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Results
              </button>
              <button
                onClick={() => navigate('/results')}
                className="btn-secondary"
              >
                View History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}