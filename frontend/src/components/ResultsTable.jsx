import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import QualityBadge from './QualityBadge'

export default function ResultsTable({ results, loading = false }) {
  const navigate = useNavigate()

  const handleRowClick = (analysisId) => {
    navigate(`/results/${analysisId}`)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="text-center py-8">Loading results...</div>
  }

  if (!results || results.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">No analyses found. Start by uploading a nanoDSF file.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-border">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Sample Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Tm (°C)</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Quality</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-400">Action</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr
              key={result.analysis_id}
              onClick={() => handleRowClick(result.analysis_id)}
              className="border-b border-dark-border hover:bg-dark-card hover:bg-opacity-50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4">
                <span className="font-semibold text-dark-text">{result.sample_name}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-400">{formatDate(result.timestamp)}</span>
              </td>
              <td className="px-6 py-4">
                <span className="font-semibold gradient-text">{result.metrics.tm.toFixed(2)}</span>
              </td>
              <td className="px-6 py-4">
                <QualityBadge quality={result.quality.quality} score={result.quality.score} />
              </td>
              <td className="px-6 py-4 text-right">
                <ChevronRight className="w-5 h-5 text-purple-accent inline" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}