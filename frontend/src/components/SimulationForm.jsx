import { useState } from 'react'
import { Beaker } from 'lucide-react'

export default function SimulationForm({ onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    base_tm: 60.0,
    base_amplitude: 0.3,
    ph: 7.4,
    protein_concentration: 1.0,
    ligand_affinity: 0.0,
    temperature_range_start: 20,
    temperature_range_end: 95,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const formFields = [
    {
      label: 'Base Melting Temperature (Tm)',
      name: 'base_tm',
      min: 20,
      max: 100,
      step: 0.5,
      unit: '°C',
      description: 'Starting Tm for simulation',
    },
    {
      label: 'Transition Amplitude',
      name: 'base_amplitude',
      min: 0.05,
      max: 1.0,
      step: 0.05,
      unit: 'ratio units',
      description: 'Height of the thermal transition',
    },
    {
      label: 'pH',
      name: 'ph',
      min: 4.0,
      max: 10.0,
      step: 0.1,
      unit: 'pH',
      description: 'Solution pH (±0.5°C per unit)',
    },
    {
      label: 'Protein Concentration',
      name: 'protein_concentration',
      min: 0.01,
      max: 100,
      step: 0.1,
      unit: 'mg/mL',
      description: 'Protein concentration effect',
    },
    {
      label: 'Ligand Affinity (Tm Shift)',
      name: 'ligand_affinity',
      min: -10,
      max: 20,
      step: 0.5,
      unit: '°C',
      description: 'Ligand-induced Tm shift',
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-semibold text-dark-text">{field.label}</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                min={field.min}
                max={field.max}
                step={field.step}
                disabled={loading}
                className="flex-1 h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-purple-accent"
              />
              <div className="w-24 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-center">
                <span className="font-semibold text-purple-accent">{formData[field.name].toFixed(2)}</span>
                <span className="text-xs text-gray-500 ml-1">{field.unit}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{field.description}</p>
          </div>
        ))}
      </div>

      <div className="card border-l-4 border-purple-accent bg-purple-accent bg-opacity-10">
        <div className="flex items-start gap-3">
          <Beaker className="w-5 h-5 text-purple-accent mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-purple-light mb-1">Simulation Effects:</p>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• pH: ±{((formData.ph - 7.4) * 0.5).toFixed(2)}°C (vs pH 7.4)</li>
              <li>• Expected Tm: {(formData.base_tm + formData.ligand_affinity + (formData.ph - 7.4) * 0.5).toFixed(2)}°C</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Simulating...' : 'Generate Curve'}
        </button>
      </div>
    </form>
  )
}