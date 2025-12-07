import { Router } from 'express';
import { 
  createBookingHandler, 
  rescheduleBookingHandler,
  cancelBookingHandler,
  getUserBookingsHandler,
  getAllBookingsHandler
} from '../controllers/bookingController';
import { streamBookings } from '../controllers/sseController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/bookings/stream - SSE stream for real-time updates (public, but can be authenticated)
router.get('/stream', streamBookings);

// POST /api/bookings - create booking (authenticated users)
router.post('/', authenticate, createBookingHandler);

// GET /api/bookings/me - get current user's bookings
router.get('/me', authenticate, getUserBookingsHandler);

// PATCH /api/bookings/:id/reschedule - reschedule booking (owner or admin)
router.patch('/:id/reschedule', authenticate, rescheduleBookingHandler);

// PATCH /api/bookings/:id/cancel - cancel booking (owner or admin)
router.patch('/:id/cancel', authenticate, cancelBookingHandler);

// GET /api/admin/bookings - all bookings grouped by room (admin only)
// Note: this is mounted separately in server.ts
export const adminBookingRoutes = Router();
adminBookingRoutes.get('/bookings', authenticate, requireRole('admin'), getAllBookingsHandler);

export default router;
