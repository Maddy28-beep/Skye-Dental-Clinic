// One-off script to create a real doctor account directly in PRODUCTION Firestore,
// bypassing the createDoctor Cloud Function (which needs the Blaze plan to be deployed).
// This only needs a service account key + the Admin SDK - both work on the free Spark
// plan, since it's Cloud Functions specifically that requires Blaze, not Firestore itself.
//
// Mirrors functions/index.js's createDoctor exactly (same scrypt hashing, same fields),
// so once Cloud Functions ARE deployed later, doctors created this way behave identically
// to ones created through the app.
//
// Setup (one time):
//   1. Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
//   2. Save the downloaded file as functions/serviceAccountKey.json (already gitignored -
//      never commit it)
//
// Usage:
//   node create-doctor-production.js "Dr. Renalyn Solarte-Pasanting" "General Dentistry" 1234

const path = require('node:path');
const crypto = require('node:crypto');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch {
  console.error(`Missing ${keyPath}.\nDownload it from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key, and save it there.`);
  process.exit(1);
}

const [, , name, specialty, pin] = process.argv;
if (!name || !pin) {
  console.error('Usage: node create-doctor-production.js "Doctor Name" "Specialty" 1234');
  process.exit(1);
}
if (!/^\d{4,6}$/.test(String(pin))) {
  console.error('PIN must be 4-6 digits.');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount), projectId: 'skye-dental-clinic' });
const db = getFirestore();

function hashPin(rawPin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(rawPin), salt, 64).toString('hex');
  return { hash, salt };
}

async function main() {
  const ref = db.collection('doctors').doc();
  const created_at = new Date().toISOString();
  await ref.set({ name, specialty: specialty || null, active: true, created_at });

  const { hash, salt } = hashPin(pin);
  await db.collection('doctor_secrets').doc(ref.id).set({ pin_hash: hash, pin_salt: salt, failed_attempts: 0, locked_until: null });

  console.log(`Created doctor "${name}" (id: ${ref.id}) with a working PIN in PRODUCTION.`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
