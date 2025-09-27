'use client';

import { broadcastTicketCreated, broadcastTicketStatusChanged } from './realtimeSimulator';

// Enhanced API client that triggers real-time events
export class TicketApiClient {
  static async createTicket(ticketData) {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Trigger real-time event for immediate UI updates
        setTimeout(() => {
          broadcastTicketCreated(result.ticket);
        }, 100);
      }

      return { response, result };
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  static async updateTicketStatus(ticketId, status, currentTicket = null) {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Trigger real-time event for immediate UI updates
        const oldStatus = currentTicket ? currentTicket.status : 'UNKNOWN';
        setTimeout(() => {
          broadcastTicketStatusChanged(ticketId, oldStatus, status, result.ticket);
        }, 100);
      }

      return { response, result };
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  static async fetchTickets(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.priority && filters.priority.length > 0) {
        params.append('priority', filters.priority.join(','));
      }
      
      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }

      const url = `/api/tickets${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      return { response, result };
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }
}