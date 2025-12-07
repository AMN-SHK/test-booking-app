import { Response } from 'express';

// SSE event types
export type SSEEventType = 'booking-created' | 'booking-cancelled' | 'booking-rescheduled';

export interface SSEBookingData {
  bookingId: string;
  roomId: string;
  roomName?: string;
  startTime: Date;
  endTime: Date;
  userId: string;
  userName?: string;
}

// store connected clients
const clients: Set<Response> = new Set();

/**
 * Add a new SSE client
 */
export const addClient = (res: Response): void => {
  // set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // prevent nginx buffering
  res.setHeader('X-Accel-Buffering', 'no');

  // send initial connection message
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to booking stream' })}\n\n`);

  clients.add(res);
  console.log(`SSE client connected. Total clients: ${clients.size}`);
};

/**
 * Remove a disconnected client
 */
export const removeClient = (res: Response): void => {
  clients.delete(res);
  console.log(`SSE client disconnected. Total clients: ${clients.size}`);
};

/**
 * Broadcast event to all connected clients
 */
export const broadcast = (event: SSEEventType, data: SSEBookingData): void => {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  console.log(`Broadcasting ${event} to ${clients.size} clients`);

  clients.forEach((client) => {
    try {
      client.write(message);
    } catch (err) {
      // client probably disconnected, remove it
      console.log('Failed to send to client, removing...');
      clients.delete(client);
    }
  });
};

/**
 * Get current client count (for debugging)
 */
export const getClientCount = (): number => {
  return clients.size;
};

