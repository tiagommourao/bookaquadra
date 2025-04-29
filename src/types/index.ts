import { PaymentMethodConfig } from './payment';

export interface SiteSettings {
  companyName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  cancellationPolicy: string;
  mercadoPagoKey: string;
  googleCalendarIntegration: boolean;
  paymentMethod?: PaymentMethodConfig;
}
