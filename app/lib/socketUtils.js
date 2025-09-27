// Simplified WebSocket utilities for Next.js integration
// This approach uses a mock implementation for development and can be extended for production

let mockClients = new Set();

export function getSocketIO() {
  // Return a mock Socket.IO instance for development
  return {
    emit: (event, data) => {
      console.log(`[Mock Socket.IO] Broadcasting event: ${event}`, data);
      // In a real implementation, this would broadcast to all connected clients
      return true;
    },
    engine: {
      clientsCount: mockClients.size
    }
  };
}

export function initializeSocketIOServer() {
  console.log('Mock Socket.IO server initialized');
  // In development, we'll use a simplified approach
  // For production, you would implement a proper WebSocket server
  
  // Simulate some connected clients for testing
  mockClients.add('mock-client-1');
  mockClients.add('mock-client-2');
  
  return true;
}

export function broadcastTicketCreated(ticket) {
  const io = getSocketIO();
  if (io) {
    console.log('Broadcasting ticket created:', ticket.id);
    io.emit('ticket:created', {
      type: 'TICKET_CREATED',
      ticket,
      timestamp: new Date().toISOString()
    });
    return true;
  }
  console.warn('Socket.IO not available for broadcasting ticket created');
  return false;
}

export function broadcastTicketUpdated(ticket) {
  const io = getSocketIO();
  if (io) {
    console.log('Broadcasting ticket updated:', ticket.id);
    io.emit('ticket:updated', {
      type: 'TICKET_UPDATED', 
      ticket,
      timestamp: new Date().toISOString()
    });
    return true;
  }
  console.warn('Socket.IO not available for broadcasting ticket updated');
  return false;
}

export function broadcastTicketStatusChanged(ticketId, oldStatus, newStatus, ticket) {
  const io = getSocketIO();
  if (io) {
    console.log('Broadcasting ticket status changed:', ticketId, oldStatus, '->', newStatus);
    io.emit('ticket:status_changed', {
      type: 'TICKET_STATUS_CHANGED',
      ticketId,
      oldStatus,
      newStatus,
      ticket,
      timestamp: new Date().toISOString()
    });
    return true;
  }
  console.warn('Socket.IO not available for broadcasting status change');
  return false;
}

export function getConnectedClientsCount() {
  const io = getSocketIO();
  return io ? io.engine.clientsCount : 0;
}

export function isSocketIOAvailable() {
  return getSocketIO() !== null;
}