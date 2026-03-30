/**
 * MyFatoorah payment gateway (supports Kuwait, Oman, UAE, Saudi, etc.)
 * Docs: https://docs.myfatoorah.com/docs/execute-payment
 *
 * Required env vars:
 *   MYFATOORAH_API_KEY   — API token from MyFatoorah portal
 *   MYFATOORAH_API_URL   — https://api.myfatoorah.com (live)
 *                          https://apitest.myfatoorah.com (sandbox)
 */
import axios from 'axios';
import { Env } from '../../lib/Env.js';
import type {
  PaymentGateway,
  GatewayInitParams,
  GatewayInitResult,
  GatewayVerifyParams,
  GatewayVerifyResult,
} from './types.js';

export class MyFatoorahGateway implements PaymentGateway {
  readonly id = 'myfatoorah';
  readonly displayName = 'MyFatoorah';

  private get baseUrl() {
    return Env.MYFATOORAH_API_URL;
  }

  private get token() {
    return Env.MYFATOORAH_API_KEY;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async initiate(params: GatewayInitParams): Promise<GatewayInitResult> {
    if (!this.token) throw new Error('MYFATOORAH_API_KEY is not configured');

    const res = await axios.post(
      `${this.baseUrl}/v2/ExecutePayment`,
      {
        PaymentMethodId: 0, // 0 = all methods page; set specific ID per gateway docs
        CustomerName: params.customerName,
        DisplayCurrencyIso: params.pricing.currency,
        MobileCountryCode: '+968',
        CustomerMobile: params.customerPhone || '00000000',
        CustomerEmail: params.customerEmail,
        InvoiceValue: params.pricing.total,
        CallBackUrl: params.callbackUrl,
        ErrorUrl: params.errorUrl,
        Language: params.language === 'ar' ? 'ar' : 'en',
        CustomerReference: params.orderId,
        UserDefinedField: params.orderId,
      },
      { headers: this.headers }
    );

    const data = res.data;
    if (!data.IsSuccess) {
      throw new Error(data.Message || 'MyFatoorah: payment initiation failed');
    }

    return {
      paymentUrl: data.Data.PaymentURL,
      gatewayPaymentId: String(data.Data.InvoiceId),
    };
  }

  async verify(params: GatewayVerifyParams): Promise<GatewayVerifyResult> {
    const res = await axios.post(
      `${this.baseUrl}/v2/GetPaymentStatus`,
      { Key: params.paymentRef, KeyType: 'InvoiceId' },
      { headers: this.headers }
    );

    const data = res.data;
    if (!data.IsSuccess) throw new Error('MyFatoorah: verification failed');

    const invoice = data.Data;
    const paid = invoice.InvoiceStatus === 'Paid';
    return {
      paid,
      paidAmount: invoice.InvoiceValue,
      currency: invoice.InvoiceDisplayValue?.split(' ')[1] || 'OMR',
      referenceId: String(invoice.InvoiceId),
    };
  }

  async parseWebhook(
    payload: unknown,
    _headers: Record<string, string>
  ): Promise<{ orderId: string; paid: boolean; paidAmount: number } | null> {
    // MyFatoorah sends InvoiceId in the webhook body; we cross-verify via API
    const body = payload as any;
    if (!body?.id && !body?.InvoiceId) return null;
    const paymentRef = String(body.id || body.InvoiceId);

    try {
      const result = await this.verify({ paymentRef });
      // UserDefinedField holds the orderId we set during initiation
      const res = await axios.post(
        `${this.baseUrl}/v2/GetPaymentStatus`,
        { Key: paymentRef, KeyType: 'InvoiceId' },
        { headers: this.headers }
      );
      const orderId = res.data?.Data?.UserDefinedField;
      if (!orderId) return null;
      return { orderId, paid: result.paid, paidAmount: result.paidAmount };
    } catch {
      return null;
    }
  }
}
