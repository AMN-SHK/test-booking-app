import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { ApiError } from './errorHandler';

/**
 * Authenticate user via JWT token
 * Extracts Bearer token from Authorization header
 * Attaches user payload to req.user
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }

    // check for Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError('Token format invalid. Use: Bearer <token>', 401);
    }

    const token = parts[1];

    // verify and decode token
    const decoded = verifyToken(token);
    
    // attach user to request
    req.user = decoded;
    
    // console.log('User authenticated:', decoded.userId);
    
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
 * Check if user has required role(s)
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

