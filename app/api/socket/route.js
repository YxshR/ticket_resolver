import { NextResponse } from 'next/server';
import { initializeSocketIOServer, getSocketIO } from '@/app/lib/socketUtils';

export async function GET() {
  try {
    // Initialize the mock Socket.IO server
    initializeSocketIOServer();
    const io = getSocketIO();
    
    const connectedClients = io ? io.engine.clientsCount : 0;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mock Socket.IO server available',
      port: 'mock', // No real port needed for mock implementation
      connectedClients,
      initialized: true,
      mode: 'development-mock'
    });
  } catch (error) {
    console.error('Error checking Socket.IO:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check Socket.IO server',
      details: error.message
    }, { status: 500 });
  }
}