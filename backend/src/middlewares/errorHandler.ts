import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ConflictError, ValidationError, NotFoundError } from '../utils/errors';
import { ConflictingBooking } from '../types/booking';

interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]> | string[];
}

interface ConflictErrorResponse {
  success: false;
  conflict: true;
  error: string;
  conflictingBookings: ConflictingBooking[];
}

// custom error class for api errors (keep for backwards compat)
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message); // keep this for debugging
  
  let statusCode = 500;
  let response: ErrorResponse | ConflictErrorResponse = {
    success: false,
    error: 'Internal server error',
  };

  // handle conflict errors (booking overlaps)
  if (err instanceof ConflictError) {
    statusCode = err.statusCode;
    response = {
      success: false,
      conflict: true,
      error: err.message,
      conflictingBookings: err.conflictingBookings,
    };
  }

  // handle validation errors from our custom class
  else if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    response.error = err.message;
  }

  // handle not found errors
  else if (err instanceof NotFoundError) {
    statusCode = err.statusCode;
    response.error = err.message;
  }

  // handle our custom api errors
  else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    response.error = err.message;
  }
  
  // handle zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    response.error = 'Validation failed';
    
    const details: Record<string, string[]> = {};
    err.issues.forEach((issue) => {
      const path = issue.path.join('.') || 'field';
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    });
    (response as ErrorResponse).details = details;
  }
  
  // handle mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    response.error = 'Validation failed';
    
    const details: Record<string, string[]> = {};
    Object.keys(err.errors).forEach((key) => {
      details[key] = [err.errors[key].message];
    });
    (response as ErrorResponse).details = details;
  }
  
  // handle mongoose duplicate key error
  else if (err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    statusCode = 409;
    response.error = 'Duplicate entry - this record already exists';
  }
  
  // handle mongoose cast errors (invalid ObjectId etc)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    response.error = `Invalid ${err.path}: ${err.value}`;
  }
  
  // handle jwt errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    response.error = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.error = 'Token has expired';
  }
  
  // generic error - dont expose details in production
  else {
    if (process.env.NODE_ENV === 'development') {
      response.error = err.message;
    }
  }

  res.status(statusCode).json(response);
};
