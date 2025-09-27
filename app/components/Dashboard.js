'use client'

import { useState, useEffect, useCallback } from 'react'
import TicketRow from './TicketRow'
import FilterPanel from './FilterPanel'
import { PageLoadingSpinner } from './LoadingSpinner'
import ErrorDisplay, { NetworkErrorDisplay } from './ErrorDisplay'
import ConnectionStatus from './ConnectionStatus'
import { useToast } from '../contexts/ToastContext'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { TicketApiClient } from '../lib/apiClient'
import { 
  initializeSocketClient, 
  subscribeToTicketEvents, 
  unsubscribeFromTicketEvents,
  isSocketConnected,
  getSocketId
} from '../lib/socketClient'

export default function Dashboard() {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState({ priority: [], status: [] })
  const [retryCount, setRetryCount] = useState(0)
  const { showSuccess, showError, showInfo } = useToast()
  const { handleApiError } = useErrorHandler()

  const fetchTickets = async (filterParams = null, showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setIsLoading(true)
      }
      setError(null)
      
      const queryParams = new URLSearchParams()
      const currentFilters = filterParams || filters
      
      if (currentFilters.priority.length > 0) {
        queryParams.set('priority', currentFilters.priority.join(','))
      }
      
      if (currentFilters.status.length > 0) {
        queryParams.set('status', currentFilters.status.join(','))
      }
      
      const { result: data } = await TicketApiClient.fetchTickets(currentFilters)
      
      setTickets(data.tickets || [])
      setFilteredTickets(data.tickets || [])
      setRetryCount(0)
      
      if (!showLoadingSpinner) {
        showSuccess('Tickets refreshed successfully')
      }
    } catch (err) {
      const { userMessage } = handleApiError(err, 'Fetch tickets')
      setError(userMessage)
      setRetryCount(prev => prev + 1)
    } finally {
      if (showLoadingSpinner) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    fetchTickets(newFilters)
  }, [])

  const handleStatusUpdate = (updatedTicket) => {
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    )
    setFilteredTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    )
  }

  const handleRefresh = useCallback(() => {
    fetchTickets(filters, false)
  }, [filters])

  const handleTicketCreated = useCallback((data) => {
    console.log('Real-time ticket created:', data)
    if (data.ticket) {
      setTickets(prevTickets => [data.ticket, ...prevTickets])
      
      const matchesFilters = (
        (filters.priority.length === 0 || filters.priority.includes(data.ticket.priority)) &&
        (filters.status.length === 0 || filters.status.includes(data.ticket.status))
      )
      
      if (matchesFilters) {
        setFilteredTickets(prevTickets => [data.ticket, ...prevTickets])
      }
      
      showInfo(`New ticket created: #${data.ticket.id.substring(0, 8)}`)
    }
  }, [showInfo, filters])

  const handleTicketUpdated = useCallback((data) => {
    console.log('Real-time ticket updated:', data)
    if (data.ticket) {
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === data.ticket.id ? data.ticket : ticket
        )
      )
      
      const matchesFilters = (
        (filters.priority.length === 0 || filters.priority.includes(data.ticket.priority)) &&
        (filters.status.length === 0 || filters.status.includes(data.ticket.status))
      )
      
      setFilteredTickets(prevTickets => {
        const existingTicket = prevTickets.find(t => t.id === data.ticket.id)
        
        if (matchesFilters) {
          if (existingTicket) {
            return prevTickets.map(ticket => 
              ticket.id === data.ticket.id ? data.ticket : ticket
            )
          } else {
            return [data.ticket, ...prevTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          }
        } else {
          return prevTickets.filter(ticket => ticket.id !== data.ticket.id)
        }
      })
      
      showInfo(`Ticket updated: #${data.ticket.id.substring(0, 8)}`)
    }
  }, [showInfo, filters])

  const handleTicketStatusChanged = useCallback((data) => {
    console.log('Real-time ticket status changed:', data)
    if (data.ticket) {
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === data.ticket.id ? data.ticket : ticket
        )
      )
      
      const matchesFilters = (
        (filters.priority.length === 0 || filters.priority.includes(data.ticket.priority)) &&
        (filters.status.length === 0 || filters.status.includes(data.ticket.status))
      )
      
      setFilteredTickets(prevTickets => {
        const existingTicket = prevTickets.find(t => t.id === data.ticket.id)
        
        if (matchesFilters) {
          if (existingTicket) {
            return prevTickets.map(ticket => 
              ticket.id === data.ticket.id ? data.ticket : ticket
            )
          } else {
            return [data.ticket, ...prevTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          }
        } else {
          return prevTickets.filter(ticket => ticket.id !== data.ticket.id)
        }
      })
      
      showInfo(`Ticket #${data.ticket.id.substring(0, 8)} status changed to ${data.newStatus}`)
    }
  }, [showInfo, filters])

  useEffect(() => {
    console.log('Initializing WebSocket connection...')
    
    try {
      const socket = initializeSocketClient()
      

      
      socket.on('connect', () => {
        console.log('Dashboard: Socket connected')
      })
      
      socket.on('disconnect', () => {
        console.log('Dashboard: Socket disconnected')
      })
      
      socket.on('reconnect', () => {
        console.log('Dashboard: Socket reconnected')
      })
      
      const eventCallbacks = {
        onTicketCreated: handleTicketCreated,
        onTicketUpdated: handleTicketUpdated,
        onTicketStatusChanged: handleTicketStatusChanged
      }
      
      subscribeToTicketEvents(eventCallbacks)
      
      return () => {
        console.log('Dashboard: Cleaning up WebSocket event listeners')
        unsubscribeFromTicketEvents(eventCallbacks)
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error)
      showError('Failed to connect to real-time updates. Some features may not work properly.')
    }
  }, [handleTicketCreated, handleTicketUpdated, handleTicketStatusChanged, showError, handleApiError])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Support Tickets Dashboard</h2>
        <PageLoadingSpinner text="Loading tickets..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Support Tickets Dashboard</h2>
        {error.includes('Network') || error.includes('connection') ? (
          <NetworkErrorDisplay onRetry={() => fetchTickets()} />
        ) : (
          <ErrorDisplay 
            error={error} 
            title="Failed to load tickets"
            onRetry={() => fetchTickets()}
            showDetails={retryCount > 2}
          />
        )}
        {retryCount > 2 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Multiple attempts failed. Try refreshing the page or check your internet connection.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <h3 className="text-xl font-semibold text-gray-900">All Tickets</h3>
          
          <ConnectionStatus showDetails={true} />
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh
          </button>
        </div>
      </div>

      <FilterPanel 
        onFilterChange={handleFilterChange}
        currentFilters={filters}
      />

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.priority.length > 0 || filters.status.length > 0 ? 'No tickets match your filters' : 'No tickets found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.priority.length > 0 || filters.status.length > 0 
              ? 'Try adjusting your filters or create a new ticket.' 
              : 'Get started by creating your first support ticket.'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200 table-responsive">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Issue
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <TicketRow 
                  key={ticket.id} 
                  ticket={ticket} 
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredTickets.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        {(filters.priority.length > 0 || filters.status.length > 0) && (
          <span className="ml-2 text-blue-600">
            (filtered)
          </span>
        )}
      </div>


    </div>
  )
}