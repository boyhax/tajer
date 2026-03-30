import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { Env } from '../lib/Env.js';

function initAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  if (Env.FIREBASE_SERVICE_ACCOUNT) {
    return initializeApp({
      credential: cert(JSON.parse(Env.FIREBASE_SERVICE_ACCOUNT)),
      projectId: Env.FIREBASE_PROJECT_ID,
    });
  }

  return initializeApp({ projectId: Env.FIREBASE_PROJECT_ID });
}

// Lazy singletons — evaluated on first access, after dotenv.config() has run.
let _db: Firestore | undefined;
let _auth: Auth | undefined;

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_t, prop) {
    if (!_db) _db = getFirestore(initAdmin(), Env.FIREBASE_DATABASE_ID);
    return (_db as any)[prop];
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_t, prop) {
    if (!_auth) _auth = getAuth(initAdmin());
    return (_auth as any)[prop];
  },
});
