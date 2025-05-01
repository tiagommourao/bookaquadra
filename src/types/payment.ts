// Tipos para pagamentos
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: PaymentStatus;
  provider: 'mercadopago' | 'stripe';
  provider_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentStatusLog {
  id: string;
  payment_id: string;
  status: PaymentStatus;
  created_at: string;
}

export interface PaymentStatistics {
  total_payments: number;
  total_amount: number;
  approved_payments: number;
  pending_payments: number;
  rejected_payments: number;
}

export interface MercadoPagoNotification {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: string;
  user_id: string;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface MercadoPagoPaymentResponse {
  id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  payment_method_id: string;
  payment_type_id: string;
  external_reference?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: any;
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
