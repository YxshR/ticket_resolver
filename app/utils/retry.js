/**
 * Retry utility for handling failed operations with exponential backoff
 */

export class RetryError extends Error {
  constructor(message, attempts, lastError) {
    super(message)
    this.name = 'RetryError'
    this.attempts = attempts
    this.lastError = lastError
  }
}

/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - The async function to retry
 * @param {Object} options - Retry configuration
 * @returns {Promise} - Result of the operation or throws RetryError
 */
export async function retry(operation, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = (error) => true,
    onRetry = null
  } = options

  let lastError
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry if we've reached max attempts
      if (attempt === maxAttempts) {
        break
      }
      
      // Don't retry if the error is not retryable
      if (!shouldRetry(error)) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      )
      
      // Add some jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt, jitteredDelay)
      }
      
      console.log(`Attempt ${attempt} failed, retrying in ${Math.round(jitteredDelay)}ms...`, error.message)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitteredDelay))
    }
  }
  
  // All attempts failed
  throw new RetryError(
    `Operation failed after ${maxAttempts} attempts`,
    maxAttempts,
    lastError
  )
}

/**
 * Predefined retry configurations for common scenarios
 */
export const retryConfigs = {
  // Quick retry for user interactions
  quick: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 1.5
  },
  
  // Standard retry for API calls
  standard: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2
  },
  
  // Aggressive retry for critical operations
  aggressive: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  },
  
  // Network-specific retry (handles common network issues)
  network: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffFactor: 2,
    shouldRetry: (error) => {
      // Retry on network errors, timeouts, and server errors
      return (
        error.name === 'TypeError' && error.message.includes('fetch') ||
        error.name === 'AbortError' ||
        error.message.includes('HTTP 5') ||
        error.message.includes('HTTP 429')
      )
    }
  }
}

/**
 * Convenience function for retrying fetch operations
 */
export async function retryFetch(url, options = {}, retryOptions = {}) {
  const { timeout = 10000, ...fetchOptions } = options
  
  return retry(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }, { ...retryConfigs.network, ...retryOptions })
}

/**
 * Hook for using retry functionality in React components
 */
export function useRetry() {
  const retryOperation = async (operation, config = 'standard') => {
    const retryConfig = typeof config === 'string' ? retryConfigs[config] : config
    return retry(operation, retryConfig)
  }
  
  return { retry: retryOperation, retryFetch }
}