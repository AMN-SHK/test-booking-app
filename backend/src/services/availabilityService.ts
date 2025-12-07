import Booking from '../models/Booking';
import Room from '../models/Room';
import { ValidationError } from '../utils/errors';

interface TimeSlot {
  start: Date;
  end: Date;
}

interface RoomAvailability {
  roomId: string;
  roomName: string;
  capacity: number;
  availableSlots: TimeSlot[];
}

/**
 * Get availability for all rooms on a specific date
 * Working hours: 8 AM - 6 PM (UTC)
 */
export const getRoomAvailability = async (dateStr: string): Promise<RoomAvailability[]> => {
  // validate date format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
  }

  // parse the date parts
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // validate parsed values
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new ValidationError('Invalid date');
  }

  // set working hours range (8 AM - 6 PM UTC)
  const dayStart = new Date(Date.UTC(year, month - 1, day, 8, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, 18, 0, 0, 0));

  // get all rooms
  const rooms = await Room.find().sort({ name: 1 }).lean();

  // get all active bookings for this date range
  const bookings = await Booking.find({
    status: 'active',
    startTime: { $lt: dayEnd },
    endTime: { $gt: dayStart },
  }).lean();

  // calculate availability for each room
  const availability: RoomAvailability[] = [];

  for (const room of rooms) {
    // get bookings for this room
    const roomBookings = bookings
      .filter((b) => b.roomId.toString() === room._id.toString())
      .map((b) => ({
        start: new Date(Math.max(b.startTime.getTime(), dayStart.getTime())),
        end: new Date(Math.min(b.endTime.getTime(), dayEnd.getTime())),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // calculate free slots
    const availableSlots = calculateFreeSlots(dayStart, dayEnd, roomBookings);

    availability.push({
      roomId: room._id.toString(),
      roomName: room.name,
      capacity: room.capacity,
      availableSlots,
    });
  }

  return availability;
};

/**
 * Calculate free time slots by subtracting booked ranges from full day
 */
function calculateFreeSlots(dayStart: Date, dayEnd: Date, bookings: TimeSlot[]): TimeSlot[] {
  if (bookings.length === 0) {
    // no bookings, entire day is free
    return [{ start: new Date(dayStart), end: new Date(dayEnd) }];
  }

  const freeSlots: TimeSlot[] = [];
  let currentStart = new Date(dayStart);

  for (const booking of bookings) {
    // if there's a gap before this booking, add it as free slot
    if (currentStart < booking.start) {
      freeSlots.push({
        start: new Date(currentStart),
        end: new Date(booking.start),
      });
    }
    
    // move current start to end of this booking
    if (booking.end > currentStart) {
      currentStart = new Date(booking.end);
    }
  }

  // if there's time left after last booking, add it
  if (currentStart < dayEnd) {
    freeSlots.push({
      start: new Date(currentStart),
      end: new Date(dayEnd),
    });
  }

  return freeSlots;
}
