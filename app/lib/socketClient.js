'use client';

import { 
  initializeRealtimeSimulator, 
  subscribeToRealtimeEvents, 
  unsubscribeFromRealtimeEvents 
} from './realtimeSimulator';

let mockSocket = null;
let eventListeners = new Map();
let isConnected = false;
let socketId = null;

export function initializeSocketClient() {
  if (!mockSocket) {
    console.log('Initializing mock Socket.IO client with real-time simulator...');
    
    initializeRealtimeSimulator();
    
    mockSocket = {
      id: `mock-${Date.now()}`,
      connected: false,
      
      connect: () => {
        console.log('Mock socket connecting...');
        setTimeout(() => {
          isConnected = true;
          socketId = mockSocket.id;
          mockSocket.connected = true;
          
          const connectListeners = eventListeners.get('connect') || [];
          connectListeners.forEach(callback => callback());
          
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
        
        const disconnectListeners = eventListeners.get('disconnect') || [];
        disconnectListeners.forEach(callback => callback('client disconnect'));
      },
      
      on: (event, callback) => {
        if (!eventListeners.has(event)) {
          eventListeners.set(event, []);
        }
        eventListeners.get(event).push(callback);
        
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
        
        if (event.startsWith('ticket:')) {
          unsubscribeFromRealtimeEvents(event, callback);
        }
      },
      
      removeAllListeners: () => {
        eventListeners.clear();
      }
    };
    
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
    try {
      initializeSocketClient();
    } catch (error) {
      console.error('Failed to initialize new socket during reconnection:', error);
      throw error;
    }
  }
}

export function checkConnectionHealth() {
  if (!mockSocket) return { connected: false, healthy: false };
  
  const connected = isConnected;
  const healthy = connected && socketId;
  
  return { connected, healthy, socketId };
}

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