import axios from 'axios';
import apiClient from './client';
import type { 
  Booking, 
  BookingResponse, 
  BookingsResponse, 
  CreateBookingDTO, 
  RescheduleBookingDTO,
  ConflictError 
} from '../types/booking';

// Custom error class for conflicts
export class BookingConflictError extends Error {
  conflict: boolean;
  conflictingBookings: Booking[];

  constructor(message: string, conflictingBookings: Booking[]) {
    super(message);
    this.name = 'BookingConflictError';
    this.conflict = true;
    this.conflictingBookings = conflictingBookings;
  }
}

export const createBooking = async (data: CreateBookingDTO): Promise<Booking> => {
  try {
    const response = await apiClient.post<BookingResponse>('/bookings', data);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      const errorData = error.response.data as ConflictError;
      throw new BookingConflictError(
        errorData.message || 'Room is already booked for this time',
        errorData.conflictingBookings || []
      );
    }
    throw error;
  }
};

export const rescheduleBooking = async (id: string, data: RescheduleBookingDTO): Promise<Booking> => {
  try {
    const response = await apiClient.patch<BookingResponse>(`/bookings/${id}/reschedule`, data);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      const errorData = error.response.data as ConflictError;
      throw new BookingConflictError(
        errorData.message || 'Room is already booked for this time',
        errorData.conflictingBookings || []
      );
    }
    throw error;
  }
};

export const cancelBooking = async (id: string): Promise<Booking> => {
  const response = await apiClient.patch<BookingResponse>(`/bookings/${id}/cancel`);
  return response.data.data;
};

export const getMyBookings = async (): Promise<Booking[]> => {
  const response = await apiClient.get<BookingsResponse>('/bookings/me');
  return response.data.data;
};

// Admin endpoints
export interface RoomBookings {
  roomId: string;
  roomName: string;
  bookings: Booking[];
}

interface AdminBookingsResponse {
  success: boolean;
  data: RoomBookings[];
}

export const getAdminBookings = async (): Promise<RoomBookings[]> => {
  const response = await apiClient.get<AdminBookingsResponse>('/admin/bookings');
  return response.data.data;
};
