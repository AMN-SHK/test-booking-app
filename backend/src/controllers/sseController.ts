import { Request, Response } from 'express';
import { addClient, removeClient } from '../services/sseService';

/**
 * Stream booking events via SSE
 * GET /api/bookings/stream
 */
export const streamBookings = (req: Request, res: Response): void => {
  // add this client to SSE manager
  addClient(res);

  // handle client disconnect
  req.on('close', () => {
    removeClient(res);
  });

  // keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch {
      // client disconnected
      clearInterval(heartbeat);
      removeClient(res);
    }
  }, 30000); // every 30 seconds

  // cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
  });
};

