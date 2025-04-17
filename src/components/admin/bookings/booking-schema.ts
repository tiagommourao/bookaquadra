import { z } from 'zod';
import { PaymentStatus } from '@/types/payment';

// Define a schema for time strings in HH:MM format
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM");

// Define a schema for date strings in YYYY-MM-DD format
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD");

// Definição do schema do formulário
export const bookingFormSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  court_id: z.string().min(1, 'Court ID is required'),
  booking_date: z.date(),
  start_time: timeSchema,
  end_time: timeSchema,
  amount: z.number().min(0, 'Amount must be a positive number'),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  payment_status: z.custom<PaymentStatus>(),
  notes: z.string().optional(),
  is_monthly: z.boolean().default(false),
  subscription_end_date: z.date().optional().nullable(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
