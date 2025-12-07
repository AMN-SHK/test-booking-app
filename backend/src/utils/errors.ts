import { ConflictingBooking } from '../types/booking';

/**
 * Base API error class
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Conflict error - 409
 * Used when booking overlaps with existing bookings
 */
export class ConflictError extends Error {
  statusCode: number = 409;
  conflict: boolean = true;
  conflictingBookings: ConflictingBooking[];

  constructor(message: string, conflictingBookings: ConflictingBooking[] = []) {
    super(message);
    this.name = 'ConflictError';
    this.conflictingBookings = conflictingBookings;
  }
}

/**
 * Validation error - 400
 */
export class ValidationError extends Error {
  statusCode: number = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error - 404
 */
export class NotFoundError extends Error {
  statusCode: number = 404;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

