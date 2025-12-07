import mongoose from 'mongoose';
import Booking, { IBooking } from '../models/Booking';
import Room from '../models/Room';
import User from '../models/User';
import { BookingResponse, ConflictingBooking } from '../types/booking';
import { ConflictError, ValidationError, NotFoundError } from '../utils/errors';

/**
 * Convert booking document to response DTO
 */
const toBookingResponse = (booking: IBooking & { 
  roomId: { _id: mongoose.Types.ObjectId; name: string } | mongoose.Types.ObjectId;
  userId: { _id: mongoose.Types.ObjectId; name: string } | mongoose.Types.ObjectId;
}): BookingResponse => {
  const roomId = typeof booking.roomId === 'object' && 'name' in booking.roomId 
    ? booking.roomId._id.toString() 
    : booking.roomId.toString();
  const roomName = typeof booking.roomId === 'object' && 'name' in booking.roomId 
    ? booking.roomId.name 
    : undefined;
  const odUserId = typeof booking.userId === 'object' && 'name' in booking.userId
    ? booking.userId._id.toString()
    : booking.userId.toString();
  const userName = typeof booking.userId === 'object' && 'name' in booking.userId
    ? booking.userId.name
    : undefined;

  return {
    id: booking._id.toString(),
    roomId,
    roomName,
    userId: odUserId,
    userName,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    createdAt: booking.createdAt,
  };
};

/**
 * Check for conflicting bookings in a room
 * Returns array of conflicting bookings if any
 */
export const checkConflicts = async (
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<ConflictingBooking[]> => {
  // find overlapping active bookings
  // overlap occurs when: existing.start < new.end AND existing.end > new.start
  const query: Record<string, unknown> = {
    roomId: new mongoose.Types.ObjectId(roomId),
    status: 'active',
    $and: [
      { startTime: { $lt: endTime } },
      { endTime: { $gt: startTime } },
    ],
  };

  // exclude current booking if rescheduling
  if (excludeBookingId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }

  const conflicts = await Booking.find(query)
    .populate('userId', 'name')
    .lean();

  return conflicts.map((b) => ({
    id: b._id.toString(),
    startTime: b.startTime,
    endTime: b.endTime,
    userName: (b.userId as { name?: string })?.name,
  }));
};

/**
 * Validate booking time constraints
 */
export const validateBookingTime = (startTime: Date, endTime: Date): void => {
  // start must be before end
  if (startTime >= endTime) {
    throw new ValidationError('Start time must be before end time');
  }

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  
  // cant book in the past (with 1 min grace period)
  if (startTime < oneMinuteAgo) {
    throw new ValidationError('Cannot create booking in the past');
  }

  // cant book more than 1 year in advance
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  if (startTime > oneYearFromNow) {
    throw new ValidationError('Cannot book more than 1 year in advance');
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (
  userId: string,
  roomId: string,
  startTime: Date,
  endTime: Date
): Promise<BookingResponse> => {
  // validate times
  validateBookingTime(startTime, endTime);

  // check room exists
  const room = await Room.findById(roomId);
  if (!room) {
    throw new NotFoundError('Room not found');
  }

  // check for conflicts
  const conflicts = await checkConflicts(roomId, startTime, endTime);
  if (conflicts.length > 0) {
    throw new ConflictError(
      'This time slot conflicts with existing booking(s)',
      conflicts
    );
  }

  // create booking
  const booking = await Booking.create({
    roomId: new mongoose.Types.ObjectId(roomId),
    userId: new mongoose.Types.ObjectId(userId),
    startTime,
    endTime,
    status: 'active',
  });

  // fetch with populated data
  const populatedBooking = await Booking.findById(booking._id)
    .populate('roomId', 'name')
    .populate('userId', 'name')
    .lean();

  if (!populatedBooking) {
    throw new Error('Failed to create booking');
  }

  console.log('Booking created:', booking._id);

  return toBookingResponse(populatedBooking as unknown as IBooking & {
    roomId: { _id: mongoose.Types.ObjectId; name: string };
    userId: { _id: mongoose.Types.ObjectId; name: string };
  });
};

