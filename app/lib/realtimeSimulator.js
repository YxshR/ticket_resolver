'use client';

let eventBus = null;

export function initializeRealtimeSimulator() {
  if (typeof window === 'undefined') return null;
  
  if (!eventBus) {
    eventBus = new EventTarget();
    console.log('Real-time simulator initialized');
  }
  
  return eventBus;
}

export function subscribeToRealtimeEvents(eventType, callback) {
  const bus = initializeRealtimeSimulator();
  if (bus) {
    bus.addEventListener(eventType, callback);
  }
}

export function unsubscribeFromRealtimeEvents(eventType, callback) {
  if (eventBus) {
    eventBus.removeEventListener(eventType, callback);
  }
}

export function broadcastRealtimeEvent(eventType, data) {
  if (eventBus) {
    const event = new CustomEvent(eventType, { detail: data });
    eventBus.dispatchEvent(event);
    console.log(`[Realtime Simulator] Broadcasting: ${eventType}`, data);
  }
}

export function broadcastTicketCreated(ticket) {
  broadcastRealtimeEvent('ticket:created', {
    type: 'TICKET_CREATED',
    ticket,
    timestamp: new Date().toISOString()
  });
}

export function broadcastTicketStatusChanged(ticketId, oldStatus, newStatus, ticket) {
  broadcastRealtimeEvent('ticket:status_changed', {
    type: 'TICKET_STATUS_CHANGED',
    ticketId,
    oldStatus,
    newStatus,
    ticket,
    timestamp: new Date().toISOString()
  });
}

export function broadcastTicketUpdated(ticket) {
  broadcastRealtimeEvent('ticket:updated', {
    type: 'TICKET_UPDATED',
    ticket,
    timestamp: new Date().toISOString()
  });
}