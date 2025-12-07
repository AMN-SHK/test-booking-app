import { Router } from 'express';
import { createRoomHandler, getRoomsHandler } from '../controllers/roomController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/rooms - public
router.get('/', getRoomsHandler);

// POST /api/rooms - admin only
router.post('/', authenticate, requireRole('admin'), createRoomHandler);

export default router;

