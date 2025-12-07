import { Response, NextFunction } from 'express';
import { createBookingSchema, rescheduleBookingSchema } from '../validators/booking';
import { 
  createBooking, 
  rescheduleBooking, 
  cancelBooking, 
  getUserBookings,
  getAllBookingsGroupedByRoom 
} from '../services/bookingService';
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

/**
 * Reschedule a booking
 * PATCH /api/bookings/:id/reschedule
 */
export const rescheduleBookingHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = rescheduleBookingSchema.parse(req.body);

    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const booking = await rescheduleBooking(id, userId, userRole, startTime, endTime);

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking
 * PATCH /api/bookings/:id/cancel
 */
export const cancelBookingHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const booking = await cancelBooking(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's bookings
 * GET /api/bookings/me
 */
export const getUserBookingsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const bookings = await getUserBookings(userId);

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings grouped by room (admin only)
 * GET /api/admin/bookings
 */
export const getAllBookingsHandler = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bookingsByRoom = await getAllBookingsGroupedByRoom();

    res.status(200).json({
      success: true,
      data: bookingsByRoom,
    });
  } catch (error) {
    next(error);
  }
};
