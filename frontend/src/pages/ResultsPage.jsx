import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dsfApi from '../api/dsfApi'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import ResultsTable from '../components/ResultsTable'
import { Home, RefreshCw } from 'lucide-react'

export default function ResultsPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    sample_name: '',
    min_quality_score: 0,
  })

  const fetchResults = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await dsfApi.getResults({
        sample_name_contains: filters.sample_name || undefined,
        min_quality_score: filters.min_quality_score || undefined,
        limit: 100,
      })

      setResults(response.data.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: name === 'min_quality_score' ? parseFloat(value) : value,
    }))
  }

  const handleApplyFilters = () => {
    fetchResults()
  }

  const handleClearFilters = () => {
    setFilters({
      sample_name: '',
      min_quality_score: 0,
    })
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Analysis History</h1>
            <p className="text-gray-400">View and manage your previous analyses</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Filters */}
        <div className="card mb-8 p-6">
          <h3 className="font-semibold text-dark-text mb-4">Filters</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sample Name</label>
              <input
                type="text"
                name="sample_name"
                value={filters.sample_name}
                onChange={handleFilterChange}
                placeholder="Search by name..."
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Minimum Quality Score</label>
              <input
                type="range"
                name="min_quality_score"
                value={filters.min_quality_score}
                onChange={handleFilterChange}
                min="0"
                max="100"
                className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-purple-accent"
              />
              <p className="text-xs text-gray-500 mt-1">{Math.round(filters.min_quality_score)}/100</p>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="btn-primary flex-1"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilters}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          {loading ? (
            <LoadingSpinner message="Loading analyses..." />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-text">
                  {results.length} Analysis{results.length !== 1 ? 'es' : ''}
                </h2>
                <button
                  onClick={() => fetchResults()}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              <ResultsTable results={results} />
            </>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/analyze')}
            className="btn-primary"
          >
            Analyze New File
          </button>
        </div>
      </div>
    </div>
  )
}