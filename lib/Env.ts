/**
 * Centralised environment variable validation and access.
 *
 * Import this module at the entry point of the server (server.ts) so that
 * missing required variables are detected immediately on startup rather than
 * silently causing failures at runtime.
 *
 * Usage:
 *   import { Env } from '../lib/Env.js';
 *   const token = Env.MYFATOORAH_API_KEY;
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function warn(key: string): void {
  if (!process.env[key]) {
    console.warn(`[Env] ${key} is not set — online payments via this gateway will fail.`);
  }
}

// ─── Validation + typed export ────────────────────────────────────────────────

/**
 * Call this once at server startup (before any route is registered).
 * Missing gateway credentials emit warnings but do NOT throw — the store may
 * be COD-only or the owner may not have configured a gateway yet.
 */
export function validateEnv(): void {
  // Firebase Admin
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      '[Env] Neither FIREBASE_SERVICE_ACCOUNT nor GOOGLE_APPLICATION_CREDENTIALS is set. ' +
      'Falling back to Application Default Credentials — this will fail in production.',
    );
  }

  // Payment gateways — only warn for the active one; never block startup.
  const activeGateway = process.env.ACTIVE_PAYMENT_GATEWAY;
  if (activeGateway === 'myfatoorah') {
    warn('MYFATOORAH_API_KEY');
  } else if (activeGateway === 'thuwani') {
    warn('THUWANI_API_KEY');
    warn('THUWANI_PUBLIC_KEY');
  } else if (activeGateway === 'amwalpay') {
    warn('AMWALPAY_MERCHANT_ID');
    warn('AMWALPAY_API_KEY');
    warn('AMWALPAY_HMAC_SECRET');
  }
  // No activeGateway set → COD-only mode, nothing to warn about.
}

// ─── Typed accessors ─────────────────────────────────────────────────────────

// Use a Proxy so every property read hits process.env at call time, not at
// module-evaluation time. This is necessary because ES module imports are
// hoisted and evaluated before dotenv.config() runs in server.ts.
export const Env = new Proxy({} as {
  // ── App ──────────────────────────────────────────────────────────────────
  APP_URL: string;
  NODE_ENV: string;
  PORT: number;
  // ── Firebase Admin SDK ───────────────────────────────────────────────────
  FIREBASE_PROJECT_ID: string;
  FIREBASE_DATABASE_ID: string;
  FIREBASE_SERVICE_ACCOUNT: string | undefined;
  // ── Payment gateways ─────────────────────────────────────────────────────
  ACTIVE_PAYMENT_GATEWAY: 'myfatoorah' | 'thuwani' | 'amwalpay';
  MYFATOORAH_API_KEY: string;
  MYFATOORAH_API_URL: string;
  THUWANI_API_KEY: string;
  THUWANI_PUBLIC_KEY: string;
  THUWANI_API_URL: string;
  AMWALPAY_MERCHANT_ID: string;
  AMWALPAY_API_KEY: string;
  AMWALPAY_API_URL: string;
  AMWALPAY_HMAC_SECRET: string;
  // ── Gemini ───────────────────────────────────────────────────────────────
  GEMINI_API_KEY: string;
}, {
  get(_target, key: string) {
    switch (key) {
      case 'PORT': return parseInt(process.env.PORT || '3000', 10);
      case 'APP_URL': return optional('APP_URL', 'http://localhost:3000');
      case 'NODE_ENV': return optional('NODE_ENV', 'development');
      case 'FIREBASE_PROJECT_ID': return optional('FIREBASE_PROJECT_ID', 'kuzama-60de7');
      case 'FIREBASE_DATABASE_ID': return optional('FIREBASE_DATABASE_ID', 'ai-studio-29973ea1-c386-4523-a9d2-0a8c2edd42e5');
      case 'FIREBASE_SERVICE_ACCOUNT': return process.env.FIREBASE_SERVICE_ACCOUNT;
      case 'ACTIVE_PAYMENT_GATEWAY': return optional('ACTIVE_PAYMENT_GATEWAY', 'myfatoorah');
      case 'MYFATOORAH_API_KEY': return optional('MYFATOORAH_API_KEY', '');
      case 'MYFATOORAH_API_URL': return optional('MYFATOORAH_API_URL', 'https://apitest.myfatoorah.com');
      case 'THUWANI_API_KEY': return optional('THUWANI_API_KEY', '');
      case 'THUWANI_PUBLIC_KEY': return optional('THUWANI_PUBLIC_KEY', '');
      case 'THUWANI_API_URL': return optional('THUWANI_API_URL', 'https://uatcheckout.thuwani.om/api/v1');
      case 'AMWALPAY_MERCHANT_ID': return optional('AMWALPAY_MERCHANT_ID', '');
      case 'AMWALPAY_API_KEY': return optional('AMWALPAY_API_KEY', '');
      case 'AMWALPAY_API_URL': return optional('AMWALPAY_API_URL', 'https://sandbox.amwalpay.com/v1');
      case 'AMWALPAY_HMAC_SECRET': return optional('AMWALPAY_HMAC_SECRET', '');
      case 'GEMINI_API_KEY': return optional('GEMINI_API_KEY', '');
      default: return undefined;
    }
  },
});
