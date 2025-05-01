
// Tipos para pagamentos
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'rejected' | 'expired';

export interface Payment {
  id: string;
  user_id?: string;
  booking_id?: string;
  amount: number;
  status: PaymentStatus;
  payment_method?: string;
  mercadopago_payment_id?: string;
  expiration_date?: string;
  raw_response?: any;
  admin_modified_by?: string;
  admin_modification_reason?: string;
  created_at: string;
  updated_at: string;
  // Campos adicionais para visualização
  first_name?: string;
  last_name?: string;
  court_name?: string;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
}

export interface PaymentStatusLog {
  id: string;
  payment_id: string;
  previous_status: string;
  new_status: string;
  created_by?: string;
  reason?: string;
  created_at: string;
}

export interface PaymentStatistics {
  totalPayments: number;
  paidAmount: number;
  pendingAmount: number;
  cancelledAmount: number;
}

export interface MercadoPagoNotification {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  payment_method: {
    id: string;
    type: string;
  };
  date_created: string;
  date_approved: string;
  payer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface PaymentMethodConfig {
  default: 'mercadopago' | 'stripe';
  mercadopago: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
  };
  stripe: {
    enabled: boolean;
    environment: 'test' | 'production';
  };
}
