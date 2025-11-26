import { Thermometer, Zap, TrendingUp, GitBranch } from 'lucide-react'

export default function MetricsCard({ metrics, className = "" }) {
  if (!metrics) return null

  const metricItems = [
    {
      icon: Thermometer,
      label: 'Melting Temperature (Tm)',
      value: `${metrics.tm?.toFixed(2)}°C`,
      secondary: `${(metrics.tmConfidence * 100)?.toFixed(0)}% confidence`,
      color: 'text-lime-accent',
    },
    {
      icon: Zap,
      label: 'Peak Slope',
      value: `${(metrics.maxSlope * 1000)?.toFixed(2)} × 10⁻³`,
      secondary: 'dRatio/dT',
      color: 'text-amber-accent',
    },
    {
      icon: TrendingUp,
      label: 'Transition Range',
      value: `${(metrics.offsetTemp - metrics.onsetTemp)?.toFixed(1)}°C`,
      secondary: `${metrics.onsetTemp?.toFixed(1)}°C → ${metrics.offsetTemp?.toFixed(1)}°C`,
      color: 'text-cyan-accent',
    },
    {
      icon: GitBranch,
      label: 'Transition Type',
      value: metrics.transitionType?.replace(/_/g, ' ') || 'Monophasic',
      secondary: `${metrics.numTransitions} transition(s)`,
      color: 'text-purple-accent',
    },
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metricItems.map((item, idx) => {
        const Icon = item.icon
        return (
          <div
            key={idx}
            className="bg-dark-card border border-dark-border rounded-lg p-4 hover:border-purple-accent transition-all duration-200 hover:shadow-glow group"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-text-secondary text-sm font-medium">{item.label}</p>
              <Icon className={`w-5 h-5 ${item.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="text-2xl font-bold text-text-primary mb-1 group-hover:text-purple-light transition-colors">
              {item.value}
            </p>
            <p className="text-xs text-text-secondary">{item.secondary}</p>
          </div>
        )
      })}
    </div>
  )
}