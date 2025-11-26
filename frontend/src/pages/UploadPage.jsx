import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [metadata, setMetadata] = useState({
    proteinName: '',
    concentration: 1.0,
    concentrationUnit: 'mg/mL',
    buffer: 'phosphate',
    pH: 7.4,
    ligand: 'none',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const csvFile = files[0]
      if (csvFile.name.endsWith('.csv') || csvFile.name.endsWith('.xlsx')) {
        setFile(csvFile)
        setError(null)
      } else {
        setError('Please upload a CSV or XLSX file')
      }
    }
  }

  const handleFileInput = (e) => {
    const csvFile = e.target.files?.[0]
    if (csvFile) {
      setFile(csvFile)
      setError(null)
    }
  }

  const handleMetadataChange = (key, value) => {
    setMetadata((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file')
      return
    }

    if (!metadata.proteinName.trim()) {
      setError('Please enter protein name')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create FormData with file and metadata
      const formData = new FormData()
      formData.append('file', file)
      
      // Send metadata as JSON string (backend expects this format)
      formData.append('metadata', JSON.stringify({
        proteinName: metadata.proteinName,
        concentration: metadata.concentration,
        concentrationUnit: metadata.concentrationUnit,
        buffer: metadata.buffer,
        pH: metadata.pH,
        ligand: metadata.ligand,
      }))

      // Log FormData for debugging
      console.log('Sending FormData with:')
      console.log('- file:', file.name)
      console.log('- metadata:', metadata)

      // POST to backend with full URL
      const apiUrl = 'http://localhost:8000/api/v1/upload'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // NOTE: Do NOT set Content-Type header - browser will set it to multipart/form-data
        // with the correct boundary automatically
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }))
        throw new Error(errorData.error || errorData.message || `Upload failed with status ${response.status}`)
      }

      // Parse successful response
      const data = await response.json()
      console.log('Success response:', data)

      // Validate response has analysis_id
      if (!data.analysis_id) {
        throw new Error('No analysis_id in response - backend may have failed')
      }

      // Navigate to results page with data
      navigate(`/results/${data.analysis_id}`, { 
        state: data,
        replace: false 
      })

    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed. Please check if backend is running at http://localhost:8000')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Upload nanoDSF Data
            </h1>
            <p className="text-text-secondary text-lg">
              Submit your thermal stability experiment data for AI-powered analysis
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Metadata Fields */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-6">
                Sample Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                {/* Protein Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Protein Name *
                  </label>
                  <input
                    type="text"
                    value={metadata.proteinName}
                    onChange={(e) => handleMetadataChange('proteinName', e.target.value)}
                    placeholder="e.g., Lysozyme"
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-text-primary placeholder-text-secondary text-sm focus:border-purple-accent focus:ring-2 focus:ring-purple-accent focus:ring-opacity-20 transition-all"
                  />
                </div>

                {/* Concentration */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Concentration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={metadata.concentration}
                      onChange={(e) =>
                        handleMetadataChange('concentration', parseFloat(e.target.value))
                      }
                      step="0.1"
                      className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-text-primary text-sm focus:border-purple-accent focus:ring-2 focus:ring-purple-accent focus:ring-opacity-20 transition-all"
                    />
                    <select
                      value={metadata.concentrationUnit}
                      onChange={(e) =>
                        handleMetadataChange('concentrationUnit', e.target.value)
                      }
                      className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-text-primary text-sm focus:border-purple-accent focus:ring-2 focus:ring-purple-accent focus:ring-opacity-20 transition-all"
                    >
                      <option value="mg/mL">mg/mL</option>
                      <option value="µM">µM</option>
                      <option value="nM">nM</option>
                    </select>
                  </div>
                </div>

                {/* Buffer */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Buffer System
                  </label>
                  <select
                    value={metadata.buffer}
                    onChange={(e) => handleMetadataChange('buffer', e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-text-primary text-sm focus:border-purple-accent focus:ring-2 focus:ring-purple-accent focus:ring-opacity-20 transition-all"
                  >
                    <option value="phosphate">Phosphate Buffer</option>
                    <option value="citrate">Citrate Buffer</option>
                    <option value="tris">Tris Buffer</option>
                    <option value="hepes">HEPES Buffer</option>
                  </select>
                </div>

                {/* pH */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    pH
                  </label>
                  <input
                    type="number"
                    value={metadata.pH}
                    onChange={(e) =>
                      handleMetadataChange('pH', parseFloat(e.target.value))
                    }
                    step="0.1"
                    min="4"
                    max="10"
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-text-primary text-sm focus:border-purple-accent focus:ring-2 focus:ring-purple-accent focus:ring-opacity-20 transition-all"
                  />
                </div>

                {/* Ligand */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Ligand / Treatment
                  </label>
                  <input
                    type="text"
                    value={metadata.ligand}
                    onChange={(e) => handleMetadataChange('ligand', e.target.value)}
                    placeholder="e.g., ATP, None"
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-text-primary placeholder-text-secondary text-sm focus:border-purple-accent focus:ring-2 focus:ring-purple-accent focus:ring-opacity-20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                isDragActive
                  ? 'border-purple-accent bg-purple-accent bg-opacity-10'
                  : 'border-dark-border hover:border-purple-accent'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-purple-accent" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Upload CSV File
              </h3>
              <p className="text-text-secondary mb-4">
                Drag and drop your nanoDSF CSV file here, or click to browse
              </p>

              {file ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-accent bg-opacity-20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-lime-accent" />
                  <span className="text-sm font-medium text-text-primary">
                    {file.name}
                  </span>
                </div>
              ) : (
                <>
                  <label htmlFor="fileInput" className="inline-block cursor-pointer">
                    <span className="px-6 py-3 bg-gradient-purple rounded-lg font-semibold text-white hover:shadow-glow transition-all">
                      Select File
                    </span>
                  </label>

                  <input
                    id="fileInput"
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </>
              )}

              <p className="text-xs text-text-secondary mt-4">
                Required columns: temperature, F330, F350
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-950 bg-opacity-50 border border-red-500 border-opacity-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-purple rounded-lg font-semibold text-white hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading & Analyzing...' : 'Upload & Analyze'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-dark-border rounded-lg font-semibold text-text-primary hover:border-purple-accent hover:bg-dark-bg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-12 p-6 bg-dark-card border border-dark-border rounded-lg">
            <h3 className="font-semibold text-text-primary mb-3">CSV Format Requirements</h3>
            <p className="text-text-secondary text-sm mb-4">
              Your CSV file should contain three columns:
            </p>
            <ul className="text-sm text-text-secondary space-y-2 font-mono">
              <li>• <span className="text-cyan-accent">temperature</span> - Temperature in °C</li>
              <li>• <span className="text-cyan-accent">F330</span> - Fluorescence at 330nm</li>
              <li>• <span className="text-cyan-accent">F350</span> - Fluorescence at 350nm</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}