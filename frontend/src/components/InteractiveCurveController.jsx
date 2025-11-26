import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function InteractiveCurveController({
  onParametersChange,
  originalTm,
  adjustedTm,
}) {
  const [parameters, setParameters] = useState({
    pH: 7.4,
    buffer: 'phosphate',
    ligand: 'none',
    concentration: 1.0,
  })

  const [toggles, setToggles] = useState({
    showAdjusted: true,
    showDerivative: true,
  })

  const handleParameterChange = (key, value) => {
    const updated = { ...parameters, [key]: value }
    setParameters(updated)
    onParametersChange(updated, toggles)
  }

  const handleToggle = (key) => {
    const updated = { ...toggles, [key]: !toggles[key] }
    setToggles(updated)
    onParametersChange(parameters, updated)
  }

  const buffers = [
    { value: 'phosphate', label: 'Phosphate Buffer (pH 7.4)' },
    { value: 'citrate', label: 'Citrate Buffer (pH 5.5)' },
    { value: 'tris', label: 'Tris Buffer (pH 8.0)' },
  ]

  const ligands = [
    { value: 'none', label: 'None' },
    { value: 'atp', label: 'ATP' },
    { value: 'nad', label: 'NAD+' },
    { value: 'poly-lysine', label: 'Poly-L-lysine' },
    { value: 'custom', label: 'Custom Ligand' },
  ]

  const tmShift = adjustedTm ? adjustedTm - originalTm : 0

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">
        Interactive Curve Control
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* pH Control */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Buffer / pH
          </label>
          <select
            value={parameters.buffer}
            onChange={(e) => handleParameterChange('buffer', e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-text-primary text-sm focus:border-purple-accent focus:ring-2 focus:ring-purple-accent focus:ring-opacity-20 transition-all"
          >
            {buffers.map((buf) => (
              <option key={buf.value} value={buf.value} className="bg-dark-card">
                {buf.label}
              </option>
            ))}
          </select>
          <input
            type="range"
            min="4"
            max="10"
            step="0.1"
            value={parameters.pH}
            onChange={(e) => handleParameterChange('pH', parseFloat(e.target.value))}
            className="w-full mt-3 h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-purple-accent"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-secondary">pH</span>
            <span className="text-sm font-semibold text-purple-accent">
              {parameters.pH.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Ligand Control */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Ligand / Treatment
          </label>
          <select
            value={parameters.ligand}
            onChange={(e) => handleParameterChange('ligand', e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-text-primary text-sm focus:border-purple-accent focus:ring-2 focus:ring-purple-accent focus:ring-opacity-20 transition-all"
          >
            {ligands.map((lig) => (
              <option key={lig.value} value={lig.value} className="bg-dark-card">
                {lig.label}
              </option>
            ))}
          </select>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={parameters.concentration}
            onChange={(e) => handleParameterChange('concentration', parseFloat(e.target.value))}
            className="w-full mt-3 h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-purple-accent"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-secondary">Concentration</span>
            <span className="text-sm font-semibold text-purple-accent">
              {parameters.concentration.toFixed(1)} mg/mL
            </span>
          </div>
        </div>

        {/* Tm Shift Indicator */}
        <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
          <p className="text-sm font-medium text-text-secondary mb-3">Tm Shift Prediction</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-text-secondary mb-1">Original Tm</p>
              <p className="text-2xl font-bold text-cyan-accent">
                {originalTm?.toFixed(1)}°C
              </p>
            </div>
            <div className="h-px bg-dark-border my-2"></div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Predicted Tm</p>
              <p className="text-2xl font-bold text-amber-accent">
                {adjustedTm?.toFixed(1)}°C
              </p>
            </div>
            <div className="pt-2 mt-2 border-t border-dark-border">
              <p className="text-xs text-text-secondary mb-1">Shift</p>
              <p
                className={`text-lg font-bold ${
                  tmShift > 0 ? 'text-lime-accent' : tmShift < 0 ? 'text-orange-400' : 'text-text-secondary'
                }`}
              >
                {tmShift > 0 ? '+' : ''}{tmShift.toFixed(1)}°C
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Switches */}
      <div className="flex gap-6 pt-6 border-t border-dark-border">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={toggles.showAdjusted}
            onChange={() => handleToggle('showAdjusted')}
            className="w-4 h-4 rounded accent-purple-accent cursor-pointer"
          />
          <span className="text-sm font-medium text-text-primary group-hover:text-purple-light transition-colors">
            Show Adjusted Curve
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={toggles.showDerivative}
            onChange={() => handleToggle('showDerivative')}
            className="w-4 h-4 rounded accent-purple-accent cursor-pointer"
          />
          <span className="text-sm font-medium text-text-primary group-hover:text-purple-light transition-colors">
            Show Derivative
          </span>
        </label>
      </div>
    </div>
  )
}