import User, { IUser } from '../models/User';
import { UserDTO } from '../types/auth';
import { ApiError } from '../middlewares/errorHandler';

/**
 * Convert user document to DTO (without password)
 */
const toUserDTO = (user: IUser): UserDTO => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

/**
 * Register a new user
 * throws 409 if email already exists
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<UserDTO> => {
  // check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    throw new ApiError('Email already registered', 409);
  }

  // create new user - password will be hashed by pre-save hook
  const user = await User.create({
    name,
    email,
    passwordHash: password, // gets hashed in pre-save
  });

  console.log('User registered:', user.email); // debug log
  
  return toUserDTO(user);
};

/**
 * Login user with email and password
 * throws 401 if credentials invalid
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<UserDTO> => {
  // find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // dont reveal if email exists or not
    throw new ApiError('Invalid email or password', 401);
  }

  // verify password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new ApiError('Invalid email or password', 401);
  }

  console.log('User logged in:', user.email);
  
  return toUserDTO(user);
};

