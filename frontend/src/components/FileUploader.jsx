import { useState } from 'react'
import { Upload, File, CheckCircle } from 'lucide-react'

export default function FileUploader({ onFileSelect, disabled = false }) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragActive(e.type === 'dragenter' || e.type === 'dragover')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`card border-2 border-dashed transition-all ${
        isDragActive
          ? 'border-purple-accent bg-purple-accent bg-opacity-10'
          : 'border-dark-border hover:border-purple-accent'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex flex-col items-center justify-center py-12">
        {selectedFile ? (
          <>
            <CheckCircle className="w-12 h-12 text-success mb-3" />
            <p className="text-lg font-semibold text-dark-text mb-2">File Selected</p>
            <p className="text-sm text-gray-400 mb-4">{selectedFile.name}</p>
            <label className="btn-primary">
              Choose Different File
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                disabled={disabled}
                className="hidden"
              />
            </label>
          </>
        ) : (
          <>
            <Upload className={`w-12 h-12 mb-3 ${isDragActive ? 'text-purple-accent' : 'text-gray-400'}`} />
            <p className="text-lg font-semibold text-dark-text mb-2">
              Drag and drop your file here
            </p>
            <p className="text-sm text-gray-400 mb-4">or</p>
            <label className="btn-primary">
              Browse Files
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                disabled={disabled}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-4">Supported: CSV, XLSX, XLS</p>
          </>
        )}
      </div>
    </div>
  )
}