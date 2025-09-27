'use client'

import { useState, useEffect } from 'react'
import { isSocketConnected, getSocketId, forceReconnect } from '../lib/socketClient'
import { useToast } from '../contexts/ToastContext'

export default function ConnectionStatus({ 
  showDetails = false, 
  className = '',
  onConnectionChange = null 
}) {
  const [isConnected, setIsConnected] = useState(false)
  const [socketId, setSocketId] = useState(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const { showError, showSuccess, showWarning } = useToast()

  useEffect(() => {
    const checkConnection = () => {
      const connected = isSocketConnected()
      const id = getSocketId()
      
      // Detect connection state changes
      if (connected !== isConnected) {
        if (connected) {
          showSuccess('Connected to real-time updates', { duration: 3000 })
          setReconnectAttempts(0)
          setIsReconnecting(false)
        } else {
          showWarning('Lost connection to real-time updates', { duration: 5000 })
        }
        
        if (onConnectionChange) {
          onConnectionChange(connected)
        }
      }
      
      setIsConnected(connected)
      setSocketId(id)
    }

    // Check immediately
    checkConnection()

    // Check periodically
    const interval = setInterval(checkConnection, 2000)

    return () => clearInterval(interval)
  }, [isConnected, onConnectionChange, showError, showSuccess, showWarning])

  const handleReconnect = async () => {
    if (isReconnecting) return

    setIsReconnecting(true)
    setReconnectAttempts(prev => prev + 1)
    
    try {
      showInfo('Attempting to reconnect...', { duration: 3000 })
      forceReconnect()
      
      // Wait a moment to see if reconnection succeeds
      setTimeout(() => {
        if (!isSocketConnected()) {
          showError('Failed to reconnect. Please refresh the page if issues persist.', { duration: 7000 })
        }
        setIsReconnecting(false)
      }, 3000)
    } catch (error) {
      console.error('Manual reconnection failed:', error)
      showError('Reconnection failed. Please refresh the page.', { duration: 7000 })
      setIsReconnecting(false)
    }
  }

  if (!showDetails && isConnected) {
    // Simple connected indicator
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-green-700 font-medium">Live</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection Status Indicator */}
      <div className={`w-3 h-3 rounded-full ${
        isConnected 
          ? 'bg-green-500 animate-pulse' 
          : isReconnecting 
          ? 'bg-yellow-500 animate-spin' 
          : 'bg-red-500'
      }`}></div>
      
      {/* Status Text */}
      <span className={`text-sm font-medium ${
        isConnected 
          ? 'text-green-700' 
          : isReconnecting 
          ? 'text-yellow-700' 
          : 'text-red-700'
      }`}>
        {isConnected 
          ? 'Live Updates' 
          : isReconnecting 
          ? 'Reconnecting...' 
          : 'Disconnected'
        }
      </span>

      {/* Socket ID (if showing details and connected) */}
      {showDetails && isConnected && socketId && (
        <span className="text-xs text-gray-500">
          ({socketId.substring(0, 8)}...)
        </span>
      )}

      {/* Reconnect Button (if disconnected) */}
      {!isConnected && !isReconnecting && (
        <button
          onClick={handleReconnect}
          className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          disabled={isReconnecting}
        >
          Reconnect
        </button>
      )}

      {/* Reconnect Attempts Counter */}
      {reconnectAttempts > 0 && (
        <span className="text-xs text-gray-500">
          (Attempt {reconnectAttempts})
        </span>
      )}
    </div>
  )
}

// Simplified connection indicator for minimal UI
export function ConnectionIndicator({ className = '' }) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(isSocketConnected())
    }

    checkConnection()
    const interval = setInterval(checkConnection, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className={`text-xs ${
        isConnected ? 'text-green-600' : 'text-red-600'
      }`}>
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  )
}