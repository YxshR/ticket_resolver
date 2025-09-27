export class RetryError extends Error {
  constructor(message, attempts, lastError) {
    super(message)
    this.name = 'RetryError'
    this.attempts = attempts
    this.lastError = lastError
  }
}

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
      
      if (attempt === maxAttempts) {
        break
      }
      
      if (!shouldRetry(error)) {
        break
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      )
      
      const jitteredDelay = delay + Math.random() * 1000
      
      if (onRetry) {
        onRetry(error, attempt, jitteredDelay)
      }
      
      console.log(`Attempt ${attempt} failed, retrying in ${Math.round(jitteredDelay)}ms...`, error.message)
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay))
    }
  }
  
  throw new RetryError(
    `Operation failed after ${maxAttempts} attempts`,
    maxAttempts,
    lastError
  )
}

export const retryConfigs = {
  quick: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 1.5
  },
  
  standard: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2
  },
  
  aggressive: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  },
  
  network: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffFactor: 2,
    shouldRetry: (error) => {
      return (
        error.name === 'TypeError' && error.message.includes('fetch') ||
        error.name === 'AbortError' ||
        error.message.includes('HTTP 5') ||
        error.message.includes('HTTP 429')
      )
    }
  }
}

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

export function useRetry() {
  const retryOperation = async (operation, config = 'standard') => {
    const retryConfig = typeof config === 'string' ? retryConfigs[config] : config
    return retry(operation, retryConfig)
  }
  
  return { retry: retryOperation, retryFetch }
}