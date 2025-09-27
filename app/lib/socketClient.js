'use client';

import { 
  initializeRealtimeSimulator, 
  subscribeToRealtimeEvents, 
  unsubscribeFromRealtimeEvents 
} from './realtimeSimulator';

// Simplified WebSocket client for development
// This provides a mock implementation that simulates real-time updates

let mockSocket = null;
let eventListeners = new Map();
let isConnected = false;
let socketId = null;

export function initializeSocketClient() {
  if (!mockSocket) {
    console.log('Initializing mock Socket.IO client with real-time simulator...');
    
    // Initialize the real-time simulator
    initializeRealtimeSimulator();
    
    // Create a mock socket object
    mockSocket = {
      id: `mock-${Date.now()}`,
      connected: false,
      
      // Mock connection methods
      connect: () => {
        console.log('Mock socket connecting...');
        setTimeout(() => {
          isConnected = true;
          socketId = mockSocket.id;
          mockSocket.connected = true;
          
          // Trigger connect event
          const connectListeners = eventListeners.get('connect') || [];
          connectListeners.forEach(callback => callback());
          
          // Trigger connected event with mock data
          const connectedListeners = eventListeners.get('connected') || [];
          connectedListeners.forEach(callback => callback({
            message: 'Connected to mock helpdesk server',
            socketId: mockSocket.id,
            timestamp: new Date().toISOString()
          }));
          
          console.log('Mock socket connected:', mockSocket.id);
        }, 100);
      },
      
      disconnect: () => {
        console.log('Mock socket disconnecting...');
        isConnected = false;
        mockSocket.connected = false;
        
        // Trigger disconnect event
        const disconnectListeners = eventListeners.get('disconnect') || [];
        disconnectListeners.forEach(callback => callback('client disconnect'));
      },
      
      // Event listener methods
      on: (event, callback) => {
        if (!eventListeners.has(event)) {
          eventListeners.set(event, []);
        }
        eventListeners.get(event).push(callback);
        
        // For ticket events, also subscribe to the real-time simulator
        if (event.startsWith('ticket:')) {
          subscribeToRealtimeEvents(event, (e) => {
            callback(e.detail);
          });
        }
      },
      
      off: (event, callback) => {
        if (eventListeners.has(event)) {
          const listeners = eventListeners.get(event);
          const index = listeners.indexOf(callback);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
        
        // For ticket events, also unsubscribe from the real-time simulator
        if (event.startsWith('ticket:')) {
          unsubscribeFromRealtimeEvents(event, callback);
        }
      },
      
      removeAllListeners: () => {
        eventListeners.clear();
      }
    };
    
    // Auto-connect
    setTimeout(() => {
      mockSocket.connect();
    }, 50);
    
    console.log('Mock Socket.IO client initialized with real-time simulator');
  }
  
  return mockSocket;
}

export function getSocketClient() {
  if (!mockSocket) {
    return initializeSocketClient();
  }
  return mockSocket;
}

export function disconnectSocket() {
  if (mockSocket) {
    console.log('Disconnecting mock Socket.IO client...');
    mockSocket.disconnect();
    mockSocket = null;
    eventListeners.clear();
    isConnected = false;
    socketId = null;
  }
}

// Event subscription helpers
export function subscribeToTicketEvents(callbacks) {
  const client = getSocketClient();
  
  if (callbacks.onTicketCreated) {
    client.on('ticket:created', callbacks.onTicketCreated);
  }
  
  if (callbacks.onTicketUpdated) {
    client.on('ticket:updated', callbacks.onTicketUpdated);
  }
  
  if (callbacks.onTicketStatusChanged) {
    client.on('ticket:status_changed', callbacks.onTicketStatusChanged);
  }
  
  return client;
}

export function unsubscribeFromTicketEvents(callbacks) {
  if (!mockSocket) return;
  
  if (callbacks.onTicketCreated) {
    mockSocket.off('ticket:created', callbacks.onTicketCreated);
  }
  
  if (callbacks.onTicketUpdated) {
    mockSocket.off('ticket:updated', callbacks.onTicketUpdated);
  }
  
  if (callbacks.onTicketStatusChanged) {
    mockSocket.off('ticket:status_changed', callbacks.onTicketStatusChanged);
  }
}

// Connection status helpers
export function isSocketConnected() {
  return isConnected;
}

export function getSocketId() {
  return socketId;
}

export function forceReconnect() {
  if (mockSocket) {
    console.log('Forcing mock Socket.IO reconnection...');
    try {
      mockSocket.disconnect();
      // Wait a moment before reconnecting
      setTimeout(() => {
        if (mockSocket) {
          mockSocket.connect();
        }
      }, 500);
    } catch (error) {
      console.error('Error during forced reconnection:', error);
      throw error;
    }
  } else {
    // If no socket exists, try to initialize a new one
    try {
      initializeSocketClient();
    } catch (error) {
      console.error('Failed to initialize new socket during reconnection:', error);
      throw error;
    }
  }
}

// Add connection health check
export function checkConnectionHealth() {
  if (!mockSocket) return { connected: false, healthy: false };
  
  const connected = isConnected;
  const healthy = connected && socketId;
  
  return { connected, healthy, socketId };
}

// Add graceful cleanup
export function cleanupSocket() {
  if (mockSocket) {
    try {
      mockSocket.removeAllListeners();
      mockSocket.disconnect();
    } catch (error) {
      console.error('Error during socket cleanup:', error);
    } finally {
      mockSocket = null;
      eventListeners.clear();
      isConnected = false;
      socketId = null;
    }
  }
}

// Simulate real-time events for testing
export function simulateTicketCreated(ticket) {
  if (mockSocket && isConnected) {
    const listeners = eventListeners.get('ticket:created') || [];
    listeners.forEach(callback => {
      setTimeout(() => {
        callback({
          type: 'TICKET_CREATED',
          ticket,
          timestamp: new Date().toISOString()
        });
      }, 100);
    });
  }
}

export function simulateTicketStatusChanged(ticketId, oldStatus, newStatus, ticket) {
  if (mockSocket && isConnected) {
    const listeners = eventListeners.get('ticket:status_changed') || [];
    listeners.forEach(callback => {
      setTimeout(() => {
        callback({
          type: 'TICKET_STATUS_CHANGED',
          ticketId,
          oldStatus,
          newStatus,
          ticket,
          timestamp: new Date().toISOString()
        });
      }, 100);
    });
  }
}