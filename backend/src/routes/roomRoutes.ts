import { Router } from 'express';
import { createRoomHandler, getRoomsHandler } from '../controllers/roomController';
import { getAvailabilityHandler } from '../controllers/availabilityController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/rooms - public
router.get('/', getRoomsHandler);

// GET /api/rooms/availability?date=YYYY-MM-DD - public
router.get('/availability', getAvailabilityHandler);

// POST /api/rooms - admin only
router.post('/', authenticate, requireRole('admin'), createRoomHandler);

export default router;
