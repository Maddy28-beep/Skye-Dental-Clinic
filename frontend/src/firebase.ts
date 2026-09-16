import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// In production, set these via frontend/.env.local (VITE_FIREBASE_*) from your Firebase
// project's web app config. The demo-* fallbacks below only work against the local
// emulator suite (`firebase emulators:start`) - they are not real credentials.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'skye-dental-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'skye-dental-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'skye-dental-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

// Vite's dev server hot-reloads any module that changes, which re-runs this file's
// top-level code on every edit - but initializeApp/initializeFirestore/connect*Emulator
// all throw if called a second time on the same app. Stashing state on globalThis (which
// survives HMR, unlike this module's own scope) makes the whole file idempotent.
const g = globalThis as unknown as { __dentalFirebase?: ReturnType<typeof setup> };

function setup() {
  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

  // ignoreUndefinedProperties: form state often carries optional fields as `undefined`
  // rather than omitting the key - Firestore rejects that by default, so we relax it here
  // instead of hunting down every `?? null` across the app.
  let db;
  try {
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    db = getFirestore(app);
  }

  const auth = getAuth(app);
  const functions = getFunctions(app);

  // Point every SDK at the local emulator suite unless explicitly told to use a real
  // project (VITE_USE_FIREBASE_EMULATOR=false), so `npm run dev` never touches production
  // data by accident.
  const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'false';
  if (useEmulator) {
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    } catch {
      // already connected from a previous HMR pass - safe to ignore
    }
  }

  return { app, db, auth, functions };
}

const instance = g.__dentalFirebase ?? (g.__dentalFirebase = setup());

export const { app, db, auth, functions } = instance;
