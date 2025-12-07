import { Request, Response, NextFunction } from 'express';
import { createRoomSchema } from '../validators/room';
import { createRoom, getAllRooms } from '../services/roomService';

/**
 * Create a new room
 * POST /api/rooms
 * Admin only
 */
export const createRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // validate input
    const { name, capacity } = createRoomSchema.parse(req.body);

    const room = await createRoom(name, capacity);

    res.status(201).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all rooms
 * GET /api/rooms
 * Public endpoint
 */
export const getRoomsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rooms = await getAllRooms();

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

