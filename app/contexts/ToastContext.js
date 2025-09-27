'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { ToastContainer } from '../components/Toast'

const ToastContext = createContext()

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random()
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      position: options.position || 'top-right'
    }

    setToasts(prev => [...prev, toast])

    setTimeout(() => {
      removeToast(id)
    }, toast.duration)

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const showSuccess = useCallback((message, options) => {
    return addToast(message, 'success', options)
  }, [addToast])

  const showError = useCallback((message, options) => {
    return addToast(message, 'error', options)
  }, [addToast])

  const showWarning = useCallback((message, options) => {
    return addToast(message, 'warning', options)
  }, [addToast])

  const showInfo = useCallback((message, options) => {
    return addToast(message, 'info', options)
  }, [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  )
}