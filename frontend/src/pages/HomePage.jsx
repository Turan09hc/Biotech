import { useNavigate } from 'react-router-dom'
import { Upload, Microscope, ArrowRight, Zap } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-accent from-0% via-purple-accent via-0% to-transparent to-80% absolute inset-0 opacity-5 pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">AI-Powered Interpretation</span>
            <br />
            of nanoDSF Thermostability Data
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Advanced thermal analysis using intelligent agents to parse, analyze, and explain 
            nanoDifferential Scanning Fluorimetry (nanoDSF) data with scientific rigor.
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {/* Analyze Card */}
          <button
            onClick={() => navigate('/analyze')}
            className="group card hover:border-purple-accent hover:shadow-glow transition-all duration-300 p-8 text-left"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-purple-accent bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-colors">
                <Upload className="w-8 h-8 text-purple-accent" />
              </div>
              <ArrowRight className="w-6 h-6 text-purple-accent opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2" />
            </div>
            <h2 className="text-2xl font-bold text-dark-text mb-2">Analyze nanoDSF File</h2>
            <p className="text-gray-400 mb-4">
              Upload your CSV or XLSX data file for immediate analysis with full metrics and visual interpretation.
            </p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>✓ Automatic curve smoothing</li>
              <li>✓ Tm determination with confidence</li>
              <li>✓ Quality assessment</li>
              <li>✓ Scientific explanation</li>
            </ul>
          </button>

          {/* Simulator Card */}
          <button
            onClick={() => navigate('/simulator')}
            className="group card hover:border-purple-accent hover:shadow-glow transition-all duration-300 p-8 text-left"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-purple-accent bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-colors">
                <Microscope className="w-8 h-8 text-purple-accent" />
              </div>
              <ArrowRight className="w-6 h-6 text-purple-accent opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2" />
            </div>
            <h2 className="text-2xl font-bold text-dark-text mb-2">Thermal Simulator</h2>
            <p className="text-gray-400 mb-4">
              Predict DSF curve behavior under different conditions: pH, concentration, ligands.
            </p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>✓ pH effect modeling</li>
              <li>✓ Ligand binding prediction</li>
              <li>✓ Concentration effects</li>
              <li>✓ Realistic curve generation</li>
            </ul>
          </button>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Instant Analysis',
                description: 'Parse and analyze DSF curves in seconds with advanced algorithms',
              },
              {
                icon: Microscope,
                title: 'Scientific Rigor',
                description: 'Tm detection using first derivative, anomaly detection, quality assessment',
              },
              {
                icon: Upload,
                title: 'Easy Integration',
                description: 'Upload CSV/XLSX files or integrate with your workflow via API',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="card p-6">
                  <div className="mb-4">
                    <Icon className="w-8 h-8 text-purple-accent" />
                  </div>
                  <h3 className="font-semibold text-dark-text mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Start */}
        <div className="card max-w-2xl mx-auto p-8 border-l-4 border-purple-accent">
          <h3 className="text-2xl font-bold mb-4 text-dark-text">Quick Start</h3>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-accent bg-opacity-20 flex items-center justify-center font-semibold text-purple-accent">1</span>
              <div>
                <p className="font-semibold text-dark-text">Prepare Your Data</p>
                <p className="text-sm text-gray-400">CSV or XLSX with temperature, F330, F350 columns</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-accent bg-opacity-20 flex items-center justify-center font-semibold text-purple-accent">2</span>
              <div>
                <p className="font-semibold text-dark-text">Upload & Analyze</p>
                <p className="text-sm text-gray-400">Click "Analyze nanoDSF File" and drag/drop your data</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-accent bg-opacity-20 flex items-center justify-center font-semibold text-purple-accent">3</span>
              <div>
                <p className="font-semibold text-dark-text">Review Results</p>
                <p className="text-sm text-gray-400">View Tm, quality metrics, curves, and scientific explanation</p>
              </div>
            </li>
          </ol>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-16">
          <button
            onClick={() => navigate('/analyze')}
            className="btn-primary inline-flex items-center gap-2 text-lg"
          >
            <Upload className="w-5 h-5" />
            Start Analysis Now
          </button>
        </div>
      </div>
    </div>
  )
}