import { AlertCircle, X } from 'lucide-react'

export default function ErrorAlert({ message, onClose, title = 'Error' }) {
  return (
    <div className="card border-l-4 border-error bg-red-950 bg-opacity-20">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-400">{title}</h3>
            <p className="text-red-300 text-sm mt-1">{message}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}