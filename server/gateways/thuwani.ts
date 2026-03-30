/**
 * Thuwani Pay — Omani payment gateway
 * Docs: https://developers.thuwani.om
 *
 * Required env vars:
 *   THUWANI_API_KEY      — Secret key from Thuwani merchant portal
 *   THUWANI_PUBLIC_KEY   — Public key (used in webhook verification)
 *   THUWANI_API_URL      — https://uatcheckout.thuwani.om/api/v1 (sandbox)
 *                          https://checkout.thuwani.om/api/v1     (production)
 *
 * Notes:
 *  - Amounts are in Baisa (1 OMR = 1000 Baisa) — integers only.
 *  - Webhook HMAC uses SHA-256 with THUWANI_PUBLIC_KEY as the key.
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

export class ThuwaniGateway implements PaymentGateway {
  readonly id = 'thuwani';
  readonly displayName = 'Thuwani Pay';

  private get baseUrl() {
    return Env.THUWANI_API_URL;
  }

  private get headers() {
    return {
      'thuwani-api-key': Env.THUWANI_API_KEY,
      'Content-Type': 'application/json',
    };
  }

  async initiate(params: GatewayInitParams): Promise<GatewayInitResult> {
    if (!Env.THUWANI_API_KEY)
      throw new Error('THUWANI_API_KEY is not configured');

    // Thuwani expects amounts in Baisa (smallest unit)
    const amountInBaisa = Math.round(params.pricing.total * 1000);

    const res = await axios.post(
      `${this.baseUrl}/checkout-session`,
      {
        client_reference_id: params.orderId,
        mode: 'payment',
        cancel_url: params.errorUrl,
        success_url: params.callbackUrl,
        locale: params.language,
        products: [
          {
            name: `Order #${params.orderId.slice(0, 8)}`,
            quantity: 1,
            unit_amount: amountInBaisa,
          },
        ],
        metadata: { orderId: params.orderId },
      },
      { headers: this.headers }
    );

    const session = res.data?.data || res.data;
    if (!session?.session_id) {
      throw new Error('Thuwani: unexpected response — no session_id');
    }

    return {
      paymentUrl: `${this.baseUrl.replace('/api/v1', '')}/pay/${session.session_id}?lang=${params.language}`,
      gatewayPaymentId: session.session_id,
    };
  }

  async verify(params: GatewayVerifyParams): Promise<GatewayVerifyResult> {
    const res = await axios.get(
      `${this.baseUrl}/checkout-session/${params.paymentRef}`,
      { headers: this.headers }
    );

    const session = res.data?.data || res.data;
    const paid = session?.payment_status === 'paid';
    const amountInBaisa: number = session?.amount_total ?? 0;

    return {
      paid,
      paidAmount: amountInBaisa / 1000,
      currency: 'OMR',
      referenceId: session?.client_reference_id,
    };
  }

  async parseWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<{ orderId: string; paid: boolean; paidAmount: number } | null> {
    // Verify HMAC-SHA256 signature
    const publicKey = Env.THUWANI_PUBLIC_KEY;
    const signature = headers['thuwani-signature'] || headers['x-thuwani-signature'];

    if (publicKey && signature) {
      const rawBody =
        typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto
        .createHmac('sha256', publicKey)
        .update(rawBody)
        .digest('hex');
      if (expected !== signature) {
        console.error('Thuwani: invalid webhook signature');
        return null;
      }
    }

    const body = payload as any;
    const sessionId: string = body?.data?.object?.id || body?.id;
    const orderId: string =
      body?.data?.object?.client_reference_id ||
      body?.data?.object?.metadata?.orderId;

    if (!orderId || !sessionId) return null;

    const paymentStatus: string =
      body?.data?.object?.payment_status || body?.payment_status;
    const amountInBaisa: number = body?.data?.object?.amount_total ?? 0;

    return {
      orderId,
      paid: paymentStatus === 'paid',
      paidAmount: amountInBaisa / 1000,
    };
  }
}
