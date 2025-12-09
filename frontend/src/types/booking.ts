import type { Room } from './room';

export interface SSEBookingEvent {
  bookingId: string;
  roomId: string;
  roomName?: string;
  startTime: string;
  endTime: string;
  userId: string;
  userName?: string;
}

export type SSEEventType = 'booking-created' | 'booking-cancelled' | 'booking-rescheduled' | 'connected';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'cancelled';
  room?: Room;
  user?: User;
  roomName?: string;
  userName?: string;
  createdAt: string;
}

export interface CreateBookingDTO {
  roomId: string;
  startTime: string;
  endTime: string;
}

export interface RescheduleBookingDTO {
  startTime: string;
  endTime: string;
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
}

export interface BookingsResponse {
  success: boolean;
  data: Booking[];
}

export interface ConflictError {
  conflict: boolean;
  message: string;
  conflictingBookings: Booking[];
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  conflict?: boolean;
  conflictingBookings?: Booking[];
}
