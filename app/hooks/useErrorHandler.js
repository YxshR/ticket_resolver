'use client'

import { useCallback } from 'react'
import { useToast } from '../contexts/ToastContext'

export function useErrorHandler() {
  const { showError, showWarning } = useToast()

  const handleError = useCallback((error, context = 'Operation') => {
    console.error(`${context} error:`, error)

    let userMessage = `${context} failed`
    let shouldRetry = true

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your connection and try again.'
    }
    // Timeout errors
    else if (error.name === 'AbortError') {
      userMessage = 'Request timed out. Please try again.'
    }
    // HTTP errors
    else if (error.message.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/)
      const status = statusMatch ? parseInt(statusMatch[1]) : null
      
      if (status >= 400 && status < 500) {
        userMessage = status === 404 
          ? 'Resource not found' 
          : status === 401 
          ? 'Authentication required'
          : status === 403
          ? 'Access denied'
          : 'Invalid request'
        shouldRetry = false
      } else if (status >= 500) {
        userMessage = 'Server error. Please try again later.'
      }
    }
    // Validation errors
    else if (error.name === 'ValidationError' || error.message.includes('validation')) {
      userMessage = 'Please check your input and try again.'
      shouldRetry = false
    }
    // Generic errors
    else if (error.message) {
      userMessage = error.message
    }

    // Show appropriate toast
    if (shouldRetry) {
      showError(userMessage)
    } else {
      showWarning(userMessage)
    }

    return { userMessage, shouldRetry }
  }, [showError, showWarning])

  const handleNetworkError = useCallback((error, operation = 'Network operation') => {
    return handleError(error, operation)
  }, [handleError])

  const handleApiError = useCallback((error, endpoint = 'API') => {
    return handleError(error, `${endpoint} request`)
  }, [handleError])

  const handleSocketError = useCallback((error, event = 'Socket operation') => {
    return handleError(error, event)
  }, [handleError])

  return {
    handleError,
    handleNetworkError,
    handleApiError,
    handleSocketError
  }
}

// Utility function to create error objects with context
export function createError(message, name = 'Error', cause = null) {
  const error = new Error(message)
  error.name = name
  if (cause) {
    error.cause = cause
  }
  return error
}

// Utility function to check if error is retryable
export function isRetryableError(error) {
  // Network errors are usually retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true
  }
  
  // Timeout errors are retryable
  if (error.name === 'AbortError') {
    return true
  }
  
  // Server errors (5xx) are retryable
  if (error.message.includes('HTTP 5')) {
    return true
  }
  
  // Rate limiting might be retryable
  if (error.message.includes('HTTP 429')) {
    return true
  }
  
  return false
}