export interface OrderPricing {
  subtotal: number;
  discountAmount: number;
  deliveryCost: number;
  taxAmount: number;
  total: number;
  currency: string;
}

export interface GatewayInitParams {
  orderId: string;
  pricing: OrderPricing;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  callbackUrl: string;
  errorUrl: string;
  language: 'en' | 'ar';
}

export interface GatewayInitResult {
  paymentUrl: string;
  gatewayPaymentId?: string;
}

export interface GatewayVerifyParams {
  /** The payment reference stored on the order (gatewayPaymentId) */
  paymentRef: string;
}

export interface GatewayVerifyResult {
  paid: boolean;
  paidAmount: number;
  currency: string;
  referenceId?: string;
}

export interface PaymentGateway {
  /** Unique identifier, e.g. 'myfatoorah' */
  readonly id: string;
  readonly displayName: string;
  initiate(params: GatewayInitParams): Promise<GatewayInitResult>;
  verify(params: GatewayVerifyParams): Promise<GatewayVerifyResult>;
  /**
   * Validates an inbound webhook payload.
   * Returns the orderId it's associated with, or null if invalid.
   */
  parseWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<{ orderId: string; paid: boolean; paidAmount: number } | null>;
}
