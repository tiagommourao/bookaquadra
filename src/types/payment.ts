
// Definição dos tipos relacionados a pagamentos

export type PaymentStatus = 'pending' | 'paid' | 'rejected' | 'expired' | 'refunded' | 'cancelled' | 'failed';

export interface Payment {
  id: string;
  booking_id?: string | null;
  user_id?: string | null;
  mercadopago_payment_id?: string | null;
  status: PaymentStatus;
  amount: number;
  payment_method?: string | null;
  expiration_date?: string | null;
  created_at: string;
  updated_at: string;
  raw_response?: any;
  admin_modified_by?: string | null;
  admin_modification_reason?: string | null;
}

export interface PaymentStatusLog {
  id: string;
  payment_id: string;
  previous_status: PaymentStatus;
  new_status: PaymentStatus;
  reason?: string;
  created_by?: string | null;
  created_at: string;
}

export interface PaymentStatistics {
  totalPayments: number;
  paidAmount: number;
  pendingAmount: number;
  cancelledAmount: number;
}
