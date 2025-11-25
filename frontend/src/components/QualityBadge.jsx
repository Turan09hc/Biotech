import { Award, AlertCircle, AlertTriangle } from 'lucide-react'

export default function QualityBadge({ quality, score }) {
  if (!quality || !score) return null

  const qualityConfig = {
    excellent: {
      bg: 'bg-green-950 border-green-700',
      text: 'text-green-300',
      icon: Award,
      label: 'Excellent',
    },
    good: {
      bg: 'bg-blue-950 border-blue-700',
      text: 'text-blue-300',
      icon: Award,
      label: 'Good',
    },
    acceptable: {
      bg: 'bg-yellow-950 border-yellow-700',
      text: 'text-yellow-300',
      icon: AlertCircle,
      label: 'Acceptable',
    },
    poor: {
      bg: 'bg-orange-950 border-orange-700',
      text: 'text-orange-300',
      icon: AlertTriangle,
      label: 'Poor',
    },
    invalid: {
      bg: 'bg-red-950 border-red-700',
      text: 'text-red-300',
      icon: AlertTriangle,
      label: 'Invalid',
    },
  }

  const config = qualityConfig[quality] || qualityConfig.acceptable
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bg} ${config.text}`}>
      <Icon className="w-4 h-4" />
      <span className="font-semibold">{config.label}</span>
      <span className="text-sm opacity-75">({score.toFixed(1)}/100)</span>
    </div>
  )
}