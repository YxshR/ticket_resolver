'use client'

import { useState } from 'react'
import { ButtonLoadingSpinner } from './LoadingSpinner'
import ErrorDisplay from './ErrorDisplay'
import { useToast } from '../contexts/ToastContext'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { TicketApiClient } from '../lib/apiClient'

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
]

export default function TicketForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    issue: '',
    priority: 'MEDIUM'
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const { showSuccess, showError, showInfo } = useToast()
  const { handleApiError } = useErrorHandler()

  const validateForm = () => {
    const newErrors = {}
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters'
    }
    
    // Issue validation
    if (!formData.issue.trim()) {
      newErrors.issue = 'Issue description is required'
    } else if (formData.issue.length > 1000) {
      newErrors.issue = 'Issue description must be less than 1000 characters'
    }
    
    // Priority validation
    if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(formData.priority)) {
      newErrors.priority = 'Please select a valid priority'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setSubmitError(null)
    setErrors({})
    
    try {
      // Use the enhanced API client that triggers real-time events
      const { response, result } = await TicketApiClient.createTicket(formData)
      
      if (result.success) {
        // Reset form on successful submission
        setFormData({
          name: '',
          issue: '',
          priority: 'MEDIUM'
        })
        setErrors({})
        setSubmitError(null)
        
        // Show success message
        showSuccess(`Ticket #${result.ticket.id.substring(0, 8)} created successfully!`)
        
        // Call onSubmit callback if provided
        if (onSubmit) {
          onSubmit(result.ticket)
        }
      } else {
        // Handle validation errors from server
        if (result.details) {
          const serverErrors = {}
          result.details.forEach(error => {
            serverErrors[error.path[0]] = error.message
          })
          setErrors(serverErrors)
        } else {
          const errorMessage = result.error || 'Failed to submit ticket'
          setSubmitError(errorMessage)
          showError(`Failed to create ticket: ${errorMessage}`)
        }
      }
    } catch (error) {
      const { userMessage } = handleApiError(error, 'Submit ticket')
      setSubmitError(userMessage)
      // Error already shown by handleApiError
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      issue: '',
      priority: 'MEDIUM'
    })
    setErrors({})
  }

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Support Ticket</h3>
        <p className="text-sm text-gray-600">Fill out the form below to submit your support request</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your name"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Issue Field */}
        <div>
          <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Description *
          </label>
          <textarea
            id="issue"
            name="issue"
            value={formData.issue}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.issue ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your issue in detail"
            disabled={isLoading}
          />
          {errors.issue && (
            <p className="mt-1 text-sm text-red-600">{errors.issue}</p>
          )}
        </div>

        {/* Priority Field */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.priority ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
          )}
        </div>

        {/* Submit Error */}
        {submitError && (
          <ErrorDisplay 
            error={submitError}
            title="Submission Failed"
            type="error"
            onRetry={() => handleSubmit({ preventDefault: () => {} })}
          />
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <ButtonLoadingSpinner text="Submitting..." />
            ) : (
              'Submit Ticket'
            )}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}