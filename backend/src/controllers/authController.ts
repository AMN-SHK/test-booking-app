import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../validators/auth';
import { registerUser, loginUser } from '../services/authService';
import { generateToken } from '../utils/auth';
import { AuthResponse } from '../types/auth';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // validate request body
    const { name, email, password } = registerSchema.parse(req.body);

    // register user
    const user = await registerUser(name, email, password);

    // generate jwt token
    const token = generateToken(user.id, user.role);

    const response: AuthResponse = {
      success: true,
      message: 'Registration successful',
      data: {
        user,
        token,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // validate request body
    const { email, password } = loginSchema.parse(req.body);

    // login user
    const user = await loginUser(email, password);

    // generate jwt
    const token = generateToken(user.id, user.role);

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

