export interface CreateBookingDTO {
  roomId: string;
  startTime: string; // ISO date string
  endTime: string;
}

export interface RescheduleBookingDTO {
  startTime: string;
  endTime: string;
}

export interface BookingResponse {
  id: string;
  roomId: string;
  roomName?: string;
  userId: string;
  userName?: string;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'cancelled';
  createdAt: Date;
}

export interface ConflictingBooking {
  id: string;
  startTime: Date;
  endTime: Date;
  userName?: string;
}

export interface ConflictError {
  conflict: true;
  message: string;
  conflictingBookings: ConflictingBooking[];
}

// bookings grouped by room
export interface BookingsByRoom {
  roomId: string;
  roomName: string;
  bookings: BookingResponse[];
}

