import { Request, Response, NextFunction } from 'express';
import { getRoomAvailability } from '../services/availabilityService';
import { ValidationError } from '../utils/errors';

/**
 * Get room availability for a specific date
 * GET /api/rooms/availability?date=YYYY-MM-DD
 */
export const getAvailabilityHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      throw new ValidationError('Date parameter is required (format: YYYY-MM-DD)');
    }

    const availability = await getRoomAvailability(date);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

