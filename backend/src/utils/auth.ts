import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-dont-use-in-prod';

/**
 * Generate JWT token for user
 * expires in 7 days
 */
export const generateToken = (userId: string, role: 'user' | 'admin'): string => {
  const payload: JWTPayload = { userId, role };
  
  // console.log('generating token for user:', userId);
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Verify JWT token and return payload
 * throws error if token is invalid or expired
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // console.log('token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Hash a password using bcrypt
 * salt rounds = 10
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

