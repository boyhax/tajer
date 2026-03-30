/**
 * AmwalPay — Omani payment gateway
 * Contact: https://amwalpay.com
 *
 * Required env vars:
 *   AMWALPAY_MERCHANT_ID  — Merchant ID from AmwalPay portal
 *   AMWALPAY_API_KEY      — API key / secret
 *   AMWALPAY_API_URL      — https://api.amwalpay.com/v1 (production)
 *                           https://sandbox.amwalpay.com/v1 (sandbox)
 *   AMWALPAY_HMAC_SECRET  — Webhook HMAC secret
 *
 * NOTE: Replace the endpoint paths and request/response field names below
 * with the exact values from your AmwalPay API documentation.
 * This implementation follows common REST gateway conventions.
 */
import axios from 'axios';
import crypto from 'crypto';
import { Env } from '../../lib/Env.js';
import type {
  PaymentGateway,
  GatewayInitParams,
  GatewayInitResult,
  GatewayVerifyParams,
  GatewayVerifyResult,
} from './types.js';

export class AmwalPayGateway implements PaymentGateway {
  readonly id = 'amwalpay';
  readonly displayName = 'AmwalPay';

  private get baseUrl() {
    return Env.AMWALPAY_API_URL;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${Env.AMWALPAY_API_KEY}`,
      'X-Merchant-Id': Env.AMWALPAY_MERCHANT_ID,
      'Content-Type': 'application/json',
    };
  }

  async initiate(params: GatewayInitParams): Promise<GatewayInitResult> {
    if (!Env.AMWALPAY_API_KEY)
      throw new Error('AMWALPAY_API_KEY is not configured');

    const res = await axios.post(
      `${this.baseUrl}/payment/initiate`,
      {
        merchant_reference: params.orderId,
        amount: params.pricing.total,
        currency: params.pricing.currency,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone || '',
        return_url: params.callbackUrl,
        cancel_url: params.errorUrl,
        language: params.language,
        description: `Order #${params.orderId.slice(0, 8)}`,
      },
      { headers: this.headers }
    );

    const data = res.data;
    // Adjust field names to match actual AmwalPay response schema
    if (!data?.success && !data?.payment_url) {
      throw new Error(data?.message || 'AmwalPay: payment initiation failed');
    }

    return {
      paymentUrl: data.payment_url || data.redirect_url,
      gatewayPaymentId: data.payment_id || data.transaction_id,
    };
  }

  async verify(params: GatewayVerifyParams): Promise<GatewayVerifyResult> {
    const res = await axios.get(
      `${this.baseUrl}/payment/${params.paymentRef}/status`,
      { headers: this.headers }
    );

    const data = res.data;
    const paid =
      data?.status === 'paid' || data?.payment_status === 'completed';

    return {
      paid,
      paidAmount: data?.amount ?? 0,
      currency: data?.currency ?? 'OMR',
      referenceId: data?.merchant_reference,
    };
  }

  async parseWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<{ orderId: string; paid: boolean; paidAmount: number } | null> {
    const hmacSecret = Env.AMWALPAY_HMAC_SECRET;
    const signature =
      headers['x-amwal-signature'] ||
      headers['x-signature'] ||
      headers['x-hmac'];

    if (hmacSecret && signature) {
      const rawBody =
        typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto
        .createHmac('sha256', hmacSecret)
        .update(rawBody)
        .digest('hex');
      if (expected !== signature) {
        console.error('AmwalPay: invalid webhook signature');
        return null;
      }
    }

    const body = payload as any;
    // Adjust field names to match actual AmwalPay webhook schema
    const orderId: string = body?.merchant_reference || body?.order_id;
    const statusRaw: string = body?.status || body?.payment_status;
    const paid = statusRaw === 'paid' || statusRaw === 'completed';
    const paidAmount: number = body?.amount ?? 0;

    if (!orderId) return null;
    return { orderId, paid, paidAmount };
  }
}
