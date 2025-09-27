'use client'

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text = null,
  className = '',
  fullScreen = false 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white',
    green: 'text-green-600',
    red: 'text-red-600'
  }

  const spinner = (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-3">
          {spinner}
          {text && (
            <p className="text-gray-600 text-sm font-medium">{text}</p>
          )}
        </div>
      </div>
    )
  }

  if (text) {
    return (
      <div className="flex items-center space-x-2">
        {spinner}
        <span className={`text-sm font-medium ${colorClasses[color]}`}>
          {text}
        </span>
      </div>
    )
  }

  return spinner
}

// Preset loading components for common use cases
export function PageLoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

export function ButtonLoadingSpinner({ text = 'Loading...', color = 'white' }) {
  return (
    <span className="flex items-center justify-center">
      <LoadingSpinner size="sm" color={color} className="-ml-1 mr-2" />
      {text}
    </span>
  )
}

export function InlineLoadingSpinner({ size = 'sm', color = 'gray' }) {
  return <LoadingSpinner size={size} color={color} />
}