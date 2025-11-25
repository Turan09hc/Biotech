import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dsfApi from '../api/dsfApi'
import SimulationForm from '../components/SimulationForm'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import CurveChart from '../components/CurveChart'
import { Home, Info } from 'lucide-react'

export default function SimulatorPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleSimulate = async (formData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await dsfApi.simulate(formData)
      setResult(response.data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const chartData = result
    ? result.temperatures.map((temp, idx) => ({
        temperature: temp,
        smoothed_ratio: result.ratios[idx],
      }))
    : []

  const downloadCSV = () => {
    if (!result) return

    let csv = 'temperature,f350_f330_ratio\n'
    result.temperatures.forEach((temp, idx) => {
      csv += `${temp.toFixed(2)},${result.ratios[idx].toFixed(6)}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `simulation-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Thermal Simulator</h1>
            <p className="text-gray-400">Predict DSF curves under different conditions</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="order-2 lg:order-1">
            <div className="card">
              <h2 className="text-xl font-bold mb-6 text-dark-text">Simulation Parameters</h2>
              {error && (
                <div className="mb-6">
                  <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
              )}
              <SimulationForm onSubmit={handleSimulate} loading={loading} />

              {/* Info Box */}
              <div className="mt-8 p-4 bg-blue-950 bg-opacity-30 rounded-lg border border-blue-900">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-300 mb-2">How it works:</p>
                    <ul className="text-blue-200 space-y-1 text-xs">
                      <li>• Base Tm: Starting melting temperature</li>
                      <li>• pH Effect: ±0.5°C per pH unit from 7.4</li>
                      <li>• Ligand Affinity: Direct Tm shift (stabilization)</li>
                      <li>• Concentration: Logarithmic stabilization effect</li>
                      <li>• Realistic noise is added to simulate experimental data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="order-1 lg:order-2">
            {loading ? (
              <div className="card">
                <LoadingSpinner message="Generating simulated curve..." />
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Predicted Tm */}
                <div className="card">
                  <h3 className="text-sm text-gray-400 mb-2">Predicted Melting Temperature</h3>
                  <p className="text-5xl font-bold gradient-text mb-2">{result.predicted_tm.toFixed(2)}°C</p>
                  <p className="text-xs text-gray-500">
                    Based on simulated conditions and parameters
                  </p>
                </div>

                {/* Chart */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-6 text-dark-text">Simulated Curve</h3>
                  <CurveChart
                    data={chartData}
                    title="Predicted F350/F330 Ratio"
                    showDerivative={false}
                  />
                </div>

                {/* Statistics */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 text-dark-text">Curve Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Min Ratio</p>
                      <p className="text-lg font-bold gradient-text">
                        {Math.min(...result.ratios).toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Max Ratio</p>
                      <p className="text-lg font-bold gradient-text">
                        {Math.max(...result.ratios).toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Transition Width</p>
                      <p className="text-lg font-bold gradient-text">~10°C</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Data Points</p>
                      <p className="text-lg font-bold gradient-text">{result.temperatures.length}</p>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={downloadCSV}
                  className="btn-primary w-full"
                >
                  Download as CSV
                </button>

                <button
                  onClick={() => setResult(null)}
                  className="btn-secondary w-full"
                >
                  New Simulation
                </button>
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    Fill in the parameters and click "Generate Curve" to see the simulation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 gradient-text">Common Use Cases</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'pH Screening',
                description: 'Test protein stability across pH range to find optimal conditions',
                params: 'Vary pH: 5.0 to 9.0, keep other parameters constant',
              },
              {
                title: 'Ligand Binding',
                description: 'Predict Tm shift when testing compound binding',
                params: 'Increase ligand_affinity: 0 to 10°C shift to predict stabilization',
              },
              {
                title: 'Buffer Optimization',
                description: 'Compare different buffer compositions before experiments',
                params: 'Adjust concentration and pH parameters to simulate buffers',
              },
            ].map((useCase, idx) => (
              <div key={idx} className="card">
                <h3 className="text-lg font-semibold text-dark-text mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{useCase.description}</p>
                <p className="text-xs text-purple-300 bg-purple-900 bg-opacity-30 rounded p-2">
                  {useCase.params}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}