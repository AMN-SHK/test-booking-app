import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { ApiError } from './errorHandler';
import { JWTPayload } from '../types/auth';

// Extend Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTPayload;
  }
}

/**
 * Authenticate middleware - checks for valid JWT token
 * Extracts Bearer token from Authorization header
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('No token provided', 401);
    }

    // get the token part after "Bearer "
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError('No token provided', 401);
    }

    // verify and decode token
    const decoded = verifyToken(token);
    
    // attach user info to request
    req.user = decoded;
    
    // console.log('user authenticated:', decoded.userId);
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('Invalid or expired token', 401));
    }
  }
};

/**
 * Role-based authorization middleware
 * Must be used after authenticate middleware
 */
export const requireRole = (...roles: Array<'user' | 'admin'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You do not have permission to access this resource', 403));
    }

    next();
  };
};

