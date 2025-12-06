import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, 'Room name must be atleast 2 characters')
    .max(100, 'Room name is too long'),
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be atleast 1')
    .max(100, 'Capacity cannot exceed 100'),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

