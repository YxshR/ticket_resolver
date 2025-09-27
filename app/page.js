'use client'

import { useState } from 'react'
import TicketForm from './components/TicketForm'
import Dashboard from './components/Dashboard'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './contexts/ToastContext'
import { ConnectionIndicator } from './components/ConnectionStatus'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleTicketSubmit = (ticket) => {
    console.log('Ticket submitted:', ticket)
    setActiveTab('dashboard')
  }

  return (
    <ErrorBoundary fallbackMessage="The helpdesk application encountered an error. Please refresh the page to continue.">
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mini Helpdesk</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Support Ticket Management</p>
              </div>
            </div>

            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                  <span className="hidden sm:inline">Dashboard</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'submit'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Submit Ticket</span>
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            {activeTab === 'dashboard' ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Support Dashboard
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  View and manage all support tickets with real-time updates
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Submit New Ticket
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Create a new support ticket and get help with your issue
                </p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {activeTab === 'submit' ? (
            <section className="flex justify-center">
              <div className="w-full max-w-md">
                <TicketForm onSubmit={handleTicketSubmit} />
              </div>
            </section>
          ) : (
            <section>
              <Dashboard />
            </section>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500">
              © 2024 Mini Helpdesk. Built with Next.js and TailwindCSS.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <ConnectionIndicator />
              <span className="hidden sm:inline">•</span>
              <span>Powered by WebSockets</span>
            </div>
          </div>
        </div>
      </footer>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
