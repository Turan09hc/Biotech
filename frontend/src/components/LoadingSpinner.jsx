export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-dark-border"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-accent border-r-purple-light animate-spin"></div>
      </div>
      <p className="text-dark-text text-lg">{message}</p>
    </div>
  )
}