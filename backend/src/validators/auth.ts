import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be atleast 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string()
    .email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be atleast 8 characters'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// infer types from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

