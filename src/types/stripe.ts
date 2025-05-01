
export interface StripeConfig {
  enabled: boolean;
  environment: 'test' | 'production';
  publishable_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  webhook_url?: string;
}

export interface StripeIntegration {
  id: string;
  name: string;
  environment: 'test' | 'production';
  publishable_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  webhook_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  last_tested_at?: string | null;
  last_test_success?: boolean | null;
  test_result_message?: string | null;
}

export interface StripeTestConnectionResult {
  success: boolean;
  message: string;
}
