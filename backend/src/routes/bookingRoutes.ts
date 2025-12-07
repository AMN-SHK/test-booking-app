import { Router } from 'express';
import { createBookingHandler } from '../controllers/bookingController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// POST /api/bookings - create booking (authenticated users)
router.post('/', authenticate, createBookingHandler);

export default router;

