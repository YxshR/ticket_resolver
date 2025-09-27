import { Server } from 'socket.io';

let io;

export function initializeSocket(httpServer) {
  if (!io) {
    console.log('Initializing Socket.IO server...');
    
    io = new Server(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('Client reconnected:', socket.id, 'Attempt:', attemptNumber);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Client reconnection attempt:', attemptNumber);
      });

      socket.emit('connected', { 
        message: 'Connected to helpdesk server',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    console.log('Socket.IO server initialized');
  }
  
  return io;
}

export function getSocketInstance() {
  if (!io) {
    throw new Error('Socket.IO server not initialized. Call initializeSocket first.');
  }
  return io;
}

export function broadcastTicketCreated(ticket) {
  if (io) {
    console.log('Broadcasting ticket created:', ticket.id);
    io.emit('ticket:created', {
      type: 'TICKET_CREATED',
      ticket,
      timestamp: new Date().toISOString()
    });
  }
}

export function broadcastTicketUpdated(ticket) {
  if (io) {
    console.log('Broadcasting ticket updated:', ticket.id);
    io.emit('ticket:updated', {
      type: 'TICKET_UPDATED', 
      ticket,
      timestamp: new Date().toISOString()
    });
  }
}

export function broadcastTicketStatusChanged(ticketId, oldStatus, newStatus, ticket) {
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
  }
}

export function getConnectedClientsCount() {
  return io ? io.engine.clientsCount : 0;
}

export function disconnectAllClients() {
  if (io) {
    io.disconnectSockets();
  }
}