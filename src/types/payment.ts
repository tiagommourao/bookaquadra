
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
  
  // Campos adicionais da view payment_details_view
  first_name?: string | null;
  last_name?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  court_name?: string | null;
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

// Interface para notificações do MercadoPago
export interface MercadoPagoNotification {
  type: string;
  data: {
    id: string;
  };
  date_created?: string;
  application_id?: string;
  user_id?: string;
  version?: number;
  api_version?: string;
  action?: string;
  live_mode?: boolean;
}

// Interface para resposta de pagamento do MercadoPago
export interface MercadoPagoPaymentResponse {
  id: number;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  money_release_date?: string;
  payment_method_id: string;
  payment_type_id: string;
  status: string;
  status_detail: string;
  currency_id: string;
  description?: string;
  transaction_amount: number;
  external_reference?: string;
  additional_info?: any;
  [key: string]: any;
}

// Interface for test connection result in MercadoPago integration
export interface TestConnectionResult {
  success: boolean;
  message: string;
}
