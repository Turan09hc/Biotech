import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Download, Share2, ArrowLeft } from 'lucide-react'
import CurveChart from '../components/CurveChart'
import MetricsCard from '../components/MetricsCard'
import ExplanationBlock from '../components/ExplanationBlock'
import InteractiveCurveController from '../components/InteractiveCurveController'
import TransitionTable from '../components/TransitionTable'

// Dummy data generator for demo
const generateDummyData = () => {
  const temperatures = Array.from({ length: 100 }, (_, i) => 20 + (i * 0.75))
  const rawRatio = temperatures.map((t) => {
    const sigmoid =
      0.4 + 0.35 / (1 + Math.exp(-((t - 60) / 3))) + (Math.random() - 0.5) * 0.02
    return Math.max(0.35, Math.min(0.85, sigmoid))
  })

  const smoothedRatio = temperatures.map((t) => 0.4 + 0.35 / (1 + Math.exp(-((t - 60) / 3))))

  const derivative = temperatures.map((t) => {
    const sigma = 3
    const exp = Math.exp(-((t - 60) ** 2) / (2 * sigma ** 2))
    return (0.35 / (sigma * Math.sqrt(2 * Math.PI))) * exp
  })

  return temperatures.map((temp, idx) => ({
    temperature: temp,
    rawRatio: rawRatio[idx],
    smoothedRatio: smoothedRatio[idx],
    adjustedRatio: smoothedRatio[idx] + (Math.random() - 0.5) * 0.01,
    derivative: derivative[idx],
  }))
}

export default function AnalysisResultsPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [data, setData] = useState(location.state || null)
  const [chartData, setChartData] = useState(generateDummyData())
  const [parameters, setParameters] = useState({
    pH: 7.4,
    buffer: 'phosphate',
    ligand: 'none',
  })
  const [toggles, setToggles] = useState({
    showAdjusted: true,
    showDerivative: true,
  })
  const [adjustedTm, setAdjustedTm] = useState(60.5)
  const [loading, setLoading] = useState(!data)

  // Default analysis data if not provided
  useEffect(() => {
    if (!data) {
      // Simulate API fetch
      setData({
        analysisId: id,
        sampleName: 'Lysozyme-pH5.5',
        metadata: {
          proteinName: 'Lysozyme',
          concentration: 1.0,
          buffer: 'Citrate',
          pH: 5.5,
          ligand: 'None',
        },
        metrics: {
          tm: 60.45,
          tmConfidence: 0.92,
          maxSlope: 0.0234,
          onsetTemp: 53.2,
          offsetTemp: 67.8,
          transitionType: 'monophasic',
          numTransitions: 1,
        },
        explanation: {
          summary:
            'This lysozyme sample exhibits a sharp, cooperative thermal unfolding transition with excellent data quality. The melting temperature of 60.45°C is consistent with literature values, indicating proper buffer conditions and sample stability.',
          detailed:
            'The DSF curve shows a single, well-defined transition characteristic of a stable, folded protein. The derivative profile reveals a narrow peak at 60.45°C, suggesting cooperative unfolding typical of two-state protein systems. The transition spans approximately 14.6°C, from onset to offset.',
          findings: [
            'Sharp, monophasic transition indicates stable, properly folded protein',
            'High Tm confidence (92%) suggests excellent data quality',
            'Narrow transition width indicates high cooperativity',
            'No anomalies or secondary transitions detected',
          ],
          recommendations: [
            'Data quality suitable for detailed structural studies',
            'Consider pH and buffer optimization for maximum stability',
            'Suitable for ligand binding and mutation studies',
            'Compare with phylogenetic variants for evolutionary insights',
          ],
        },
        quality: 'Excellent',
        transitions: [
          {
            name: 'Primary Unfolding',
            color: '#A68CFF',
            onset: 53.2,
            peak: 60.45,
            offset: 67.8,
            maxSlope: 0.0234,
            peakHeight: 0.35,
          },
        ],
      })
      setLoading(false)
    }
  }, [id, data])

  const handleParametersChange = (newParams, newToggles) => {
    setParameters(newParams)
    setToggles(newToggles)

    // Simulate Tm shift based on parameters
    let tmShift = 0
    tmShift += (newParams.pH - 7.4) * 0.3 // pH effect
    if (newParams.ligand !== 'none') tmShift += 2.5 // Ligand effect

    setAdjustedTm(data.metrics.tm + tmShift)
  }

  const handleExport = (format) => {
    if (format === 'json') {
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.sampleName}_analysis.json`
      link.click()
    } else if (format === 'csv') {
      const csv = [
        ['Temperature', 'Raw Ratio', 'Smoothed Ratio', 'Derivative'],
        ...chartData.map((d) => [
          d.temperature.toFixed(2),
          d.rawRatio.toFixed(4),
          d.smoothedRatio.toFixed(4),
          d.derivative.toFixed(6),
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n')

      const dataBlob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.sampleName}_curves.csv`
      link.click()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-dark-border border-t-purple-accent animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No data found</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gradient-purple rounded-lg font-semibold text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-purple-accent hover:text-purple-light transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-4xl font-bold text-text-primary">{data.sampleName}</h1>
            <p className="text-text-secondary mt-2">
              {data.metadata.proteinName} • {data.metadata.concentration}{' '}
              {data.metadata.concentrationUnit} • {data.metadata.buffer} pH{' '}
              {data.metadata.pH}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 border border-dark-border rounded-lg text-text-primary hover:border-purple-accent transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-purple rounded-lg font-semibold text-white hover:shadow-glow transition-all"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Metrics */}
          <MetricsCard metrics={data.metrics} />

          {/* AI Explanation */}
          <ExplanationBlock explanation={data.explanation} quality={data.quality} />

          {/* Main DSF Curve */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <CurveChart
              data={chartData}
              tm={data.metrics.tm}
              adjustedTm={toggles.showAdjusted ? adjustedTm : undefined}
              showAdjusted={toggles.showAdjusted}
              showDerivative={toggles.showDerivative}
              height={400}
            />
          </div>

          {/* Interactive Controller */}
          <InteractiveCurveController
            onParametersChange={handleParametersChange}
            originalTm={data.metrics.tm}
            adjustedTm={adjustedTm}
          />

          {/* Updated Chart with Adjustments */}
          {toggles.showAdjusted && (
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Curve with Adjustments
              </h3>
              <CurveChart
                data={chartData}
                tm={data.metrics.tm}
                adjustedTm={adjustedTm}
                showAdjusted={true}
                showDerivative={toggles.showDerivative}
                height={350}
              />
              <div className="mt-4 pt-4 border-t border-dark-border text-sm text-text-secondary">
                <p>
                  <strong>Buffer:</strong> {parameters.buffer} • <strong>pH:</strong>{' '}
                  {parameters.pH.toFixed(1)} • <strong>Ligand:</strong> {parameters.ligand}
                </p>
              </div>
            </div>
          )}

          {/* Transition Table */}
          <TransitionTable transitions={data.transitions} />

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/upload')}
              className="flex-1 px-6 py-3 bg-gradient-purple rounded-lg font-semibold text-white hover:shadow-glow transition-all"
            >
              Analyze Another
            </button>
            <button
              onClick={() => navigate('/compare')}
              className="flex-1 px-6 py-3 border border-dark-border rounded-lg font-semibold text-text-primary hover:border-purple-accent transition-colors"
            >
              Add to Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}