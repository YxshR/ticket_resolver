'use client'

import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { InlineLoadingSpinner } from './LoadingSpinner'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { TicketApiClient } from '../lib/apiClient'

const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-800'
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'CLOSED', label: 'Closed' }
]

export default function TicketRow({ ticket, onStatusUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useState(ticket.status)
  const [error, setError] = useState(null)
  const { showError, showSuccess, showInfo } = useToast()
  const { handleApiError } = useErrorHandler()

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPriority = (priority) => {
    return priority.charAt(0) + priority.slice(1).toLowerCase()
  }

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const handleStatusChange = async (newStatus) => {
    if (newStatus === optimisticStatus || isUpdating) {
      return
    }

    const previousStatus = optimisticStatus
    
    setError(null)
    
    setOptimisticStatus(newStatus)
    setIsUpdating(true)

    try {
      const { response, result } = await TicketApiClient.updateTicketStatus(ticket.id, newStatus, ticket)

      if (result.success) {
        if (onStatusUpdate) {
          onStatusUpdate(result.ticket)
        }
        
        showSuccess(`Ticket #${ticket.id.substring(0, 8)} status updated to ${newStatus.replace('_', ' ').toLowerCase()}`)
      } else {
        setOptimisticStatus(previousStatus)
        const errorMessage = result.error || 'Failed to update ticket status'
        setError(errorMessage)
        showError(`Failed to update ticket: ${errorMessage}`)
        console.error('Failed to update ticket status:', result.error)
      }
    } catch (error) {
      setOptimisticStatus(previousStatus)
      const { userMessage } = handleApiError(error, 'Update ticket status')
      setError(userMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        <span className="sm:hidden">#{ticket.id.slice(-4)}</span>
        <span className="hidden sm:inline">#{ticket.id.slice(-8)}</span>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
        <div className="max-w-[120px] sm:max-w-none truncate" title={ticket.name}>
          {ticket.name}
        </div>
        <div className="sm:hidden text-xs text-gray-500 mt-1 max-w-[120px] truncate" title={ticket.issue}>
          {ticket.issue}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 hidden sm:table-cell">
        <div className="max-w-xs truncate" title={ticket.issue}>
          {ticket.issue}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>
          <span className="sm:hidden">{ticket.priority.charAt(0)}</span>
          <span className="hidden sm:inline">{formatPriority(ticket.priority)}</span>
        </span>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <select
            value={optimisticStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              STATUS_COLORS[optimisticStatus]
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </option>
            ))}
          </select>
          {isUpdating && <InlineLoadingSpinner size="sm" color="gray" />}
          {error && (
            <div className="w-4 h-4 text-red-500" title={error}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}
        </div>
        <div className="lg:hidden text-xs text-gray-500 mt-1">
          {formatDate(ticket.createdAt)}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
        {formatDate(ticket.createdAt)}
      </td>
    </tr>
  )
}