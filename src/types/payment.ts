
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled' | 'in_process' | 'in_mediation' | 'charged_back';

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  payment_method?: string;
  mercadopago_payment_id?: string;
  booking_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  expiration_date?: string;
  admin_modified_by?: string;
  admin_modification_reason?: string;
  raw_response?: any;
}

export interface PaymentStatusLog {
  id: string;
  payment_id: string;
  previous_status: PaymentStatus;
  new_status: PaymentStatus;
  created_by?: string;
  reason?: string;
  created_at: string;
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
  date_created: string;
  date_approved: string;
  date_last_updated: string;
  date_of_expiration: string;
  money_release_date: string;
  operation_type: string;
  issuer_id: string;
  payment_method_id: string;
  payment_type_id: string;
  status: string;
  status_detail: string;
  currency_id: string;
  description: string;
  live_mode: boolean;
  sponsor_id: null;
  authorization_code: string;
  money_release_schema: null;
  taxes_amount: number;
  counter_currency: null;
  brand_id: null;
  shipping_amount: number;
  pos_id: null;
  store_id: null;
  integrator_id: null;
  platform_id: null;
  corporation_id: null;
  collector_id: number;
  payer: {
    first_name: string;
    last_name: string;
    email: string;
    identification: {
      number: string;
      type: string;
    };
    phone: {
      area_code: string;
      number: string;
      extension: null;
    };
    entity_type: null;
    id: string;
    type: null;
  };
  marketplace_owner: null;
  metadata: Record<string, any>;
  additional_info: {
    available_balance: null;
    nsu_processadora: null;
    authentication_code: null;
  };
  order: Record<string, any>;
  external_reference: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  differential_pricing_id: null;
  deduction_schema: null;
  installments: number;
  transaction_details: {
    payment_method_reference_id: null;
    acquirer_reference: null;
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    external_resource_url: null;
    installment_amount: number;
    financial_institution: null;
    payable_deferral_period: null;
    bank_transfer_id: null;
    transaction_id: null;
  };
  fee_details: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  charges_details: Array<{
    id: string;
    name: string;
    type: string;
    accounts: {
      from: string;
      to: string;
    };
    client_id: number;
    date_created: string;
    last_updated: string;
    amounts: {
      original: number;
      refunded: number;
    };
    metadata: Record<string, any>;
    reserve_id: null;
    refund_charges: Array<any>;
  }>;
  captured: boolean;
  binary_mode: boolean;
  call_for_authorize_id: null;
  statement_descriptor: string;
  card: {
    id: null;
    first_six_digits: string;
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
    date_created: string;
    date_last_updated: string;
    cardholder: {
      name: string;
      identification: {
        number: string;
        type: string;
      };
    };
  };
  notification_url: string;
  refunds: Array<any>;
  processing_mode: string;
  merchant_account_id: null;
  merchant_number: null;
  point_of_interaction: {
    type: string;
    business_info: {
      unit: string;
      sub_unit: string;
    };
    transaction_data: {
      qr_code: string;
      bank_transfer_id: null;
      transaction_id: null;
      e2e_id: null;
      financial_institution: null;
      ticket_url: string;
      bank_info: {
        payer: {
          account_id: null;
          id: null;
          long_name: null;
          account_holder_name: null;
          identification: {
            number: null;
            type: null;
          };
        };
        collector: {
          account_id: null;
          account_holder_name: string;
          long_name: string;
          account_number: string;
          predefined_bank: null;
        };
        is_same_bank_account_owner: null;
        origin_bank_id: null;
        origin_wallet_id: null;
      };
      qr_code_base64: string;
    };
    application_data: {
      name: null;
      version: null;
    };
  };
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface PaymentStatistics {
  totalBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  approvedPayments: number;
}

// Definição do tipo para configurações de métodos de pagamento
export interface PaymentMethodConfig {
  default: 'mercadopago' | 'stripe' | 'manual';
  mercadopago?: {
    enabled: boolean;
    [key: string]: any;
  };
  stripe?: {
    enabled: boolean;
    [key: string]: any;
  };
  manual?: {
    enabled: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}
