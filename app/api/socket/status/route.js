import { NextResponse } from 'next/server';
import { getSocketIO, getConnectedClientsCount, isSocketIOAvailable } from '@/app/lib/socketUtils';

export async function GET() {
  try {
    const isAvailable = isSocketIOAvailable();
    const clientsCount = getConnectedClientsCount();
    
    return NextResponse.json({
      success: true,
      socketIO: {
        available: isAvailable,
        connectedClients: clientsCount,
        path: '/api/socket',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking Socket.IO status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check Socket.IO status',
      socketIO: {
        available: false,
        connectedClients: 0
      }
    }, { status: 500 });
  }
}