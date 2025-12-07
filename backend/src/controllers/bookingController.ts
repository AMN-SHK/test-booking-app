import { Response, NextFunction } from 'express';
import { createBookingSchema } from '../validators/booking';
import { createBooking } from '../services/bookingService';
import { AuthRequest } from '../middlewares/authMiddleware';

/**
 * Create a new booking
 * POST /api/bookings
 */
export const createBookingHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // validate input
    const { roomId, startTime, endTime } = createBookingSchema.parse(req.body);

    // get user id from auth
    const userId = req.user!.userId;

    const booking = await createBooking(userId, roomId, startTime, endTime);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

