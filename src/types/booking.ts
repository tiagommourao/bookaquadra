
// Tipos para reservas
import { PaymentStatus } from './payment';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  is_monthly?: boolean;
  subscription_end_date?: string | null;
  court?: {
    id: string;
    name: string;
    type_id: string;
    image_url?: string | null;
  };
}

export interface BookingRequest {
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  amount: number;
  is_monthly?: boolean;
  subscription_end_date?: string | null;
  notes?: string | null;
}

export interface BookingResponse {
  booking: Booking;
  payment_url?: string | null;
}
