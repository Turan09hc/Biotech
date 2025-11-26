import { Lightbulb, CheckCircle, AlertCircle } from 'lucide-react'

export default function ExplanationBlock({ explanation, quality, className = "" }) {
  if (!explanation) return null

  const qualityColor = {
    excellent: '#10B981',
    good: '#06B6D4',
    acceptable: '#F59E0B',
    poor: '#EF4444',
  }[quality?.toLowerCase()] || '#A68CFF'

  return (
    <div className={`bg-dark-card border border-dark-border rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-4 mb-6">
        <div className="p-2 bg-gradient-purple bg-opacity-20 rounded-lg">
          <Lightbulb className="w-5 h-5 text-purple-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">AI Analysis Explanation</h3>
          <p className="text-text-secondary text-sm mt-1">Generated from thermal profile</p>
        </div>
      </div>

      {/* Main Summary */}
      <div className="mb-6 p-4 bg-dark-bg rounded-lg border border-purple-accent border-opacity-30">
        <p className="text-text-primary leading-relaxed text-sm">
          {explanation.summary || explanation}
        </p>
      </div>

      {/* Detailed Explanation */}
      {explanation.detailed && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-primary mb-2">Detailed Analysis</h4>
          <p className="text-text-secondary text-sm leading-relaxed">
            {explanation.detailed}
          </p>
        </div>
      )}

      {/* Key Findings */}
      {explanation.findings && explanation.findings.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-lime-accent" />
            Key Findings
          </h4>
          <ul className="space-y-2">
            {explanation.findings.map((finding, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-purple-accent font-bold">→</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {explanation.recommendations && explanation.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-accent" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {explanation.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-lime-accent">✓</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quality Indicator */}
      {quality && (
        <div className="mt-6 pt-6 border-t border-dark-border flex items-center gap-2">
          <span className="text-text-secondary text-sm">Data Quality:</span>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: qualityColor }}
            ></div>
            <span className="text-sm font-medium text-text-primary capitalize">
              {quality}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}