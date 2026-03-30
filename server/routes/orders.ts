/**
 * Order routes:
 *   POST /api/order/preview  — compute server-authoritative pricing without creating an order
 *   POST /api/order/create   — create order, initiate payment (or confirm COD)
 *   GET  /api/order/:orderId — fetch order details (owner or admin only)
 */
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '../admin.js';
import { getGateway, type GatewayId } from '../gateways/index.js';
import type { OrderPricing } from '../gateways/types.js';
import { Env } from '../../lib/Env.js';

export const ordersRouter = new Hono();

// ── Shared types ─────────────────────────────────────────────────────────────

interface PricingInput {
  items: { productId: string; quantity: number }[];
  deliveryMethodId: string;
  destinationRegionId: string;
}

interface VerifiedItem {
  id: string;
  name: any;
  price: number;
  effectivePrice: number;
  quantity: number;
}

interface PricingResult {
  pricing: OrderPricing;
  verifiedItems: VerifiedItem[];
  deliveryMethodName: string;
  storeRegionId: string;
  appSettings: {
    taxRate?: number;
    storeRegionId?: string;
    paymentMethods?: { online?: boolean; cod?: boolean; gateways?: string[] };
  };
}

// ── Helper: verify Bearer token and return decoded uid/email/name ─────────────

async function verifyToken(authHeader: string) {
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) throw Object.assign(new Error('Missing authorization token'), { status: 401 });
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return {
      userId: decoded.uid,
      userEmail: decoded.email as string | undefined,
      userName: (decoded.name || decoded.email || '') as string,
    };
  } catch {
    throw Object.assign(new Error('Invalid or expired token'), { status: 401 });
  }
}

// ── Helper: compute server-authoritative pricing ──────────────────────────────

async function computePricing(input: PricingInput): Promise<PricingResult> {
  const { items, deliveryMethodId, destinationRegionId } = input;

  const [settingsSnap, deliverySnap, tagsSnap] = await Promise.all([
    adminDb.doc('settings/app').get(),
    adminDb.doc(`deliveryMethods/${deliveryMethodId}`).get(),
    adminDb.collection('tags').get(),
  ]);

  const appSettings = (settingsSnap.data() ?? {}) as {
    taxRate?: number;
    storeRegionId?: string;
    paymentMethods?: { online?: boolean; cod?: boolean; gateways?: string[] };
  };

  if (!deliverySnap.exists) throw Object.assign(new Error('Delivery method not found'), { status: 400 });
  const deliveryMethod = deliverySnap.data() as {
    name: string;
    priceMatrix: Record<string, Record<string, number>>;
    isPublished: boolean;
  };
  if (!deliveryMethod.isPublished) {
    throw Object.assign(new Error('Delivery method is not available'), { status: 400 });
  }

  // Fetch products (authoritative prices)
  const productRefs = items.map(i => adminDb.doc(`products/${i.productId}`));
  const productSnaps = await adminDb.getAll(...productRefs);

  let subtotal = 0;
  const verifiedItems: VerifiedItem[] = [];

  for (const item of items) {
    const snap = productSnaps.find(s => s.id === item.productId);
    if (!snap?.exists) {
      throw Object.assign(new Error(`Product not found: ${item.productId}`), { status: 400 });
    }
    const p = snap.data() as any;
    if (p.status !== 'published') {
      throw Object.assign(
        new Error(`Product "${p.locals?.name?.en || p.name}" is not available`),
        { status: 400 },
      );
    }
    if (typeof p.stock === 'number' && p.stock < item.quantity) {
      throw Object.assign(
        new Error(`Insufficient stock for "${p.locals?.name?.en || p.name}"`),
        { status: 400 },
      );
    }
    const discountPct: number = p.discount ?? 0;
    const effectivePrice = p.price * (1 - discountPct / 100);
    subtotal += effectivePrice * item.quantity;
    verifiedItems.push({
      id: item.productId,
      name: p.locals?.name || p.name,
      price: p.price,
      effectivePrice,
      quantity: item.quantity,
    });
  }

  // Tag-level discounts (highest applicable discount wins per type)
  let tagProductDiscountPct = 0;
  let tagDeliveryDiscountPct = 0;
  for (const tagDoc of tagsSnap.docs) {
    const tag = tagDoc.data() as any;
    const applicable = verifiedItems.some(vi => {
      const snap = productSnaps.find(s => s.id === vi.id);
      const pTags: string[] = snap?.data()?.tags || [];
      return pTags.includes(tagDoc.id);
    });
    if (!applicable) continue;
    if (tag.discountType === 'product' && (tag.discountValue ?? 0) > tagProductDiscountPct) {
      tagProductDiscountPct = tag.discountValue;
    }
    if (tag.discountType === 'delivery' && (tag.discountValue ?? 0) > tagDeliveryDiscountPct) {
      tagDeliveryDiscountPct = tag.discountValue;
    }
  }

  const discountAmount = subtotal * (tagProductDiscountPct / 100);

  // Delivery cost from region price matrix
  const storeRegionId = appSettings?.storeRegionId || '';
  let deliveryCost: number =
    deliveryMethod.priceMatrix?.[storeRegionId]?.[destinationRegionId] ?? 0;
  deliveryCost = deliveryCost * (1 - tagDeliveryDiscountPct / 100);

  // Tax
  const taxRate: number = appSettings?.taxRate ?? 0;
  const taxableBase = subtotal - discountAmount + deliveryCost;
  const taxAmount = taxableBase * (taxRate / 100);

  const total = Math.max(0, taxableBase + taxAmount);

  const pricing: OrderPricing = {
    subtotal: +subtotal.toFixed(3),
    discountAmount: +discountAmount.toFixed(3),
    deliveryCost: +deliveryCost.toFixed(3),
    taxAmount: +taxAmount.toFixed(3),
    total: +total.toFixed(3),
    currency: 'OMR',
  };

  return { pricing, verifiedItems, deliveryMethodName: deliveryMethod.name, storeRegionId, appSettings };
}

// ── POST /api/order/preview ───────────────────────────────────────────────────
// Computes server-side pricing for the current cart without creating an order.
// Use this in the checkout UI to show verified breakdown before confirming.

ordersRouter.post('/preview', async (c) => {
  try {
    await verifyToken(c.req.header('authorization') ?? '');
  } catch (err: any) {
    return c.json({ error: err.message }, (err.status ?? 401) as any);
  }

  let body: PricingInput;
  try { body = await c.req.json() as PricingInput; }
  catch { return c.json({ error: 'Invalid JSON body' }, 400); }

  const { items, deliveryMethodId, destinationRegionId } = body;

  if (!items?.length) return c.json({ error: 'No items' }, 400);
  if (!deliveryMethodId) return c.json({ error: 'Missing deliveryMethodId' }, 400);
  if (!destinationRegionId) return c.json({ error: 'Missing destinationRegionId' }, 400);

  try {
    const { pricing, verifiedItems, deliveryMethodName, appSettings } =
      await computePricing({ items, deliveryMethodId, destinationRegionId });

    return c.json({
      pricing,
      deliveryMethodName,
      items: verifiedItems,
      paymentMethods: appSettings.paymentMethods,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Internal server error' }, (err.status ?? 500) as any);
  }
});

// ── POST /api/order/create ────────────────────────────────────────────────────

interface OrderCreateBody extends PricingInput {
  paymentGateway: GatewayId | 'cod';
  customerAddress: string;
  destinationCoords?: { lat: number; lng: number };
  language: 'en' | 'ar';
}

ordersRouter.post('/create', async (c) => {
  // 1. Authenticate
  let caller: Awaited<ReturnType<typeof verifyToken>>;
  try {
    caller = await verifyToken(c.req.header('authorization') ?? '');
  } catch (err: any) {
    return c.json({ error: err.message }, (err.status ?? 401) as any);
  }
  const { userId, userEmail, userName } = caller!;

  let body: OrderCreateBody;
  try { body = await c.req.json() as OrderCreateBody; }
  catch { return c.json({ error: 'Invalid JSON body' }, 400); }

  const { items, deliveryMethodId, destinationRegionId, paymentGateway,
          customerAddress, destinationCoords, language } = body;

  if (!items?.length) return c.json({ error: 'No items' }, 400);
  if (!deliveryMethodId) return c.json({ error: 'Missing deliveryMethodId' }, 400);
  if (!destinationRegionId) return c.json({ error: 'Missing destinationRegionId' }, 400);
  if (!paymentGateway) return c.json({ error: 'Missing paymentGateway' }, 400);
  if (!customerAddress) return c.json({ error: 'Missing customerAddress' }, 400);

  try {
    // 2. Compute pricing
    const { pricing, verifiedItems, storeRegionId, appSettings } =
      await computePricing({ items, deliveryMethodId, destinationRegionId });

    // 3. Validate payment method availability
    const onlineAllowed = appSettings?.paymentMethods?.online !== false;
    const codAllowed = appSettings?.paymentMethods?.cod !== false;
    if (paymentGateway === 'cod' && !codAllowed) {
      return c.json({ error: 'Cash on delivery is not available' }, 400);
    }
    if (paymentGateway !== 'cod' && !onlineAllowed) {
      return c.json({ error: 'Online payment is not available' }, 400);
    }

    // 4. Persist order via Admin SDK
    const orderData = {
      userId,
      items: verifiedItems,
      ...pricing,
      totalAmount: pricing.total,
      verifiedTotal: pricing.total,
      status: 'pending',
      paymentMethod: paymentGateway === 'cod' ? 'cod' : 'online',
      gateway: paymentGateway,
      deliveryMethodId,
      destinationRegionId,
      storeRegionId,
      createdAt: FieldValue.serverTimestamp(),
      customerInfo: {
        name: userName,
        email: userEmail || '',
        address: customerAddress,
        ...(destinationCoords ? { destinationCoords } : {}),
      },
    };

    const orderRef = await adminDb.collection('orders').add(orderData);
    const orderId = orderRef.id;

    // 5a. Cash on delivery
    if (paymentGateway === 'cod') {
      await orderRef.update({ status: 'confirmed' });
      await adminDb.collection('notifications').add({
        userId,
        title: { en: 'Order Placed', ar: 'تم تقديم الطلب' },
        body: {
          en: `Your order #${orderId.slice(0, 6)} has been placed (Cash on Delivery).`,
          ar: `تم تقديم طلبك رقم #${orderId.slice(0, 6)} (الدفع عند الاستلام).`,
        },
        type: 'order_update',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        metadata: { orderId },
      });
      return c.json({ orderId, pricing });
    }

    // 5b. Online payment — initiate gateway
    const gateway = getGateway(paymentGateway as GatewayId);
    const appUrl = Env.APP_URL;

    const { paymentUrl, gatewayPaymentId } = await gateway.initiate({
      orderId,
      pricing,
      customerName: userName,
      customerEmail: userEmail || '',
      callbackUrl: `${appUrl}?orderId=${orderId}&gateway=${paymentGateway}`,
      errorUrl: `${appUrl}?orderId=${orderId}&paymentFailed=1`,
      language,
    });

    await orderRef.update({ gatewayPaymentId });

    return c.json({ orderId, pricing, paymentUrl });

  } catch (err: any) {
    console.error('Order creation error:', err?.message || err);
    return c.json({ error: err?.message || 'Internal server error' }, (err.status ?? 500) as any);
  }
});

// ── GET /api/order/:orderId ───────────────────────────────────────────────────
// Returns order details. Only the order owner or an admin may fetch it.

ordersRouter.get('/:orderId', async (c) => {
  let caller: Awaited<ReturnType<typeof verifyToken>>;
  try {
    caller = await verifyToken(c.req.header('authorization') ?? '');
  } catch (err: any) {
    return c.json({ error: err.message }, (err.status ?? 401) as any);
  }

  const orderId = c.req.param('orderId');
  if (!orderId) return c.json({ error: 'Missing orderId' }, 400);

  try {
    const orderSnap = await adminDb.doc(`orders/${orderId}`).get();
    if (!orderSnap.exists) return c.json({ error: 'Order not found' }, 404);

    const order = orderSnap.data() as any;

    // Check ownership (or admin role via custom claims)
    const isOwner = order.userId === caller!.userId;
    const userRecord = await adminAuth.getUser(caller!.userId);
    const claims = userRecord.customClaims as any;
    const isAdminClaim = claims?.admin === true || claims?.roles?.includes('admin');

    if (!isOwner && !isAdminClaim) {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json({
      orderId,
      status: order.status,
      pricing: {
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        deliveryCost: order.deliveryCost,
        taxAmount: order.taxAmount,
        total: order.verifiedTotal ?? order.totalAmount,
        currency: order.currency ?? 'OMR',
      } as OrderPricing,
      items: order.items,
      deliveryMethodId: order.deliveryMethodId,
      destinationRegionId: order.destinationRegionId,
      gateway: order.gateway,
      customerInfo: order.customerInfo,
      createdAt: order.createdAt,
    });
  } catch (err: any) {
    console.error('Order fetch error:', err?.message || err);
    return c.json({ error: err?.message || 'Internal server error' }, 500);
  }
});
