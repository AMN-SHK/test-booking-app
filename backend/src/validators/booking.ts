import { z } from 'zod';

// helper to validate mongodb ObjectId format
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBookingSchema = z.object({
  roomId: z
    .string()
    .regex(objectIdRegex, 'Invalid room ID format'),
  startTime: z
    .string()
    .datetime({ message: 'Invalid start time format. Use ISO 8601' })
    .transform((val) => new Date(val)),
  endTime: z
    .string()
    .datetime({ message: 'Invalid end time format. Use ISO 8601' })
    .transform((val) => new Date(val)),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const rescheduleBookingSchema = z.object({
  startTime: z
    .string()
    .datetime({ message: 'Invalid start time format' })
    .transform((val) => new Date(val)),
  endTime: z
    .string()
    .datetime({ message: 'Invalid end time format' })
    .transform((val) => new Date(val)),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

