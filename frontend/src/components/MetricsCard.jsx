import { TrendingUp, Zap, Wind, Target } from 'lucide-react'

export default function MetricsCard({ metrics }) {
  if (!metrics) return null

  const metricItems = [
    {
      label: 'Melting Temperature (Tm)',
      value: `${metrics.tm?.toFixed(2)}°C`,
      icon: TrendingUp,
      confidence: `${(metrics.tm_confidence * 100).toFixed(0)}% confidence`,
    },
    {
      label: 'Transition Type',
      value: metrics.transition_type?.replace(/_/g, ' '),
      icon: Zap,
      detail: `${metrics.num_transitions} transition${metrics.num_transitions !== 1 ? 's' : ''}`,
    },
    {
      label: 'Max Slope',
      value: `${(metrics.max_slope * 1000).toFixed(2)} × 10⁻³`,
      icon: Wind,
      detail: 'dRatio/dT',
    },
    {
      label: 'Transition Range',
      value: `${(metrics.offset_temperature - metrics.onset_temperature).toFixed(1)}°C`,
      icon: Target,
      detail: `${metrics.onset_temperature?.toFixed(1)}°C → ${metrics.offset_temperature?.toFixed(1)}°C`,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricItems.map((item, idx) => {
        const Icon = item.icon
        return (
          <div key={idx} className="card">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">{item.label}</h3>
              <Icon className="w-5 h-5 text-purple-accent" />
            </div>
            <p className="text-2xl font-bold gradient-text mb-1">{item.value}</p>
            {item.confidence && <p className="text-xs text-green-400">{item.confidence}</p>}
            {item.detail && <p className="text-xs text-gray-500">{item.detail}</p>}
          </div>
        )
      })}
    </div>
  )
}