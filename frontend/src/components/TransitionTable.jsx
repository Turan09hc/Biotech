import { ChevronDown } from 'lucide-react'

export default function TransitionTable({ transitions, className = "" }) {
  if (!transitions || transitions.length === 0) {
    return (
      <div className={`bg-dark-card border border-dark-border rounded-lg p-6 text-center ${className}`}>
        <p className="text-text-secondary">No transition data available</p>
      </div>
    )
  }

  return (
    <div className={`bg-dark-card border border-dark-border rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border bg-dark-bg">
              <th className="px-6 py-4 text-left font-semibold text-text-primary">
                Transition
              </th>
              <th className="px-6 py-4 text-left font-semibold text-text-primary">
                Onset (°C)
              </th>
              <th className="px-6 py-4 text-left font-semibold text-text-primary">
                Peak (°C)
              </th>
              <th className="px-6 py-4 text-left font-semibold text-text-primary">
                Offset (°C)
              </th>
              <th className="px-6 py-4 text-left font-semibold text-text-primary">
                Width (°C)
              </th>
              <th className="px-6 py-4 text-left font-semibold text-text-primary">
                Peak Height
              </th>
              <th className="px-6 py-4 text-left font-semibold text-text-primary">
                Cooperativity
              </th>
            </tr>
          </thead>
          <tbody>
            {transitions.map((transition, idx) => {
              const width = transition.offset - transition.onset
              const cooperativity = transition.slope / (width || 1)

              return (
                <tr
                  key={idx}
                  className="border-b border-dark-border hover:bg-dark-bg hover:bg-opacity-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: transition.color || '#A68CFF' }}
                      ></span>
                      <span className="font-medium text-text-primary">
                        {transition.name || `Transition ${idx + 1}`}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {transition.onset?.toFixed(2) || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-amber-accent">
                      {transition.peak?.toFixed(2) || transition.tm?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {transition.offset?.toFixed(2) || '-'}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {width?.toFixed(2) || '-'}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {transition.peakHeight?.toFixed(4) || transition.maxSlope?.toFixed(4) || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-accent bg-opacity-20 text-purple-light">
                      {cooperativity?.toFixed(3) || 'N/A'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend/Notes */}
      <div className="px-6 py-4 bg-dark-bg border-t border-dark-border text-xs text-text-secondary space-y-1">
        <p>
          <strong>Onset:</strong> Temperature where transition begins (10% of peak)
        </p>
        <p>
          <strong>Peak:</strong> Temperature of maximum rate of change (Tm)
        </p>
        <p>
          <strong>Offset:</strong> Temperature where transition completes (90% of peak)
        </p>
        <p>
          <strong>Cooperativity:</strong> Peak height / transition width (higher = more cooperative)
        </p>
      </div>
    </div>
  )
}