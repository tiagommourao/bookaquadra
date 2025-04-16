
import { z } from 'zod';
import { isFullHourTime } from './booking-utils';

export const bookingSchema = z.object({
  user_id: z.string().uuid({ message: 'Selecione um usuário' }),
  court_id: z.string().uuid({ message: 'Selecione uma quadra' }),
  booking_date: z.date({ required_error: 'Selecione uma data' }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }).refine(isFullHourTime, {
    message: "O horário de início deve ser uma hora fechada (ex: 08:00, 09:00)"
  }),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }).refine(isFullHourTime, {
    message: "O horário de término deve ser uma hora fechada (ex: 09:00, 10:00)"
  }),
  amount: z.coerce.number().positive({ message: "Valor deve ser positivo" }),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  payment_status: z.enum(['pending', 'paid', 'refunded', 'failed']),
  notes: z.string().optional(),
  is_monthly: z.boolean().default(false),
  subscription_end_date: z.date().optional()
}).refine((data) => {
  if (data.is_monthly && !data.subscription_end_date) {
    return false;
  }
  return true;
}, {
  message: "Data final da mensalidade é obrigatória quando mensalista está selecionado",
  path: ["subscription_end_date"]
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
