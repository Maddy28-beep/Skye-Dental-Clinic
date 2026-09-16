const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('node:crypto');

initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'skye-dental-demo' });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function hashPin(pin, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPinHash(pin, salt, expectedHash) {
  return hashPin(pin, salt).hash === expectedHash;
}

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required');
  }
}

async function logAudit({ userName, role, action, entityType, entityId, patientId, description }) {
  await db.collection('audit_logs').add({
    user_name: userName || 'Unknown',
    role: role || 'staff',
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    patient_id: patientId || null,
    description,
    created_at: new Date().toISOString(),
  });
}

// Shared PIN lookup: given only a PIN (never a doctor id), finds which active doctor it
// belongs to. This is what makes "verified by" trustworthy - nothing in the caller's
// request names a doctor, so an assistant can never attribute a verification to the
// wrong doctor. Used by both the standalone PIN check and payment verification below.
async function verifyDoctorPinCore(pin) {
  if (!pin) throw new HttpsError('invalid-argument', 'pin is required');

  const now = new Date();
  const doctorsSnap = await db.collection('doctors').where('active', '==', true).get();
  const doctors = doctorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (doctors.length === 0) throw new HttpsError('permission-denied', 'Invalid PIN');

  const secretDocs = await Promise.all(doctors.map((d) => db.collection('doctor_secrets').doc(d.id).get()));
  const isLocked = (secret) => secret.locked_until && new Date(secret.locked_until) > now;

  let matchedDoctor = null;
  let matchedRef = null;
  const unlocked = [];

  for (let i = 0; i < doctors.length; i++) {
    const secretDoc = secretDocs[i];
    if (!secretDoc.exists) continue;
    const secret = secretDoc.data();
    if (isLocked(secret)) continue;
    unlocked.push({ ref: secretDoc.ref, secret, doctor: doctors[i] });
    if (!matchedDoctor && verifyPinHash(pin, secret.pin_salt, secret.pin_hash)) {
      matchedDoctor = doctors[i];
      matchedRef = secretDoc.ref;
    }
  }

  if (matchedDoctor) {
    await matchedRef.update({ failed_attempts: 0, locked_until: null });
    return matchedDoctor;
  }

  const withSecrets = secretDocs.filter((s) => s.exists).length;
  if (withSecrets > 0 && unlocked.length === 0) {
    throw new HttpsError('resource-exhausted', 'Too many failed attempts. Try again later.');
  }

  await Promise.all(
    unlocked.map(async ({ ref, secret, doctor }) => {
      const attempts = (secret.failed_attempts || 0) + 1;
      if (attempts >= MAX_PIN_ATTEMPTS) {
        const lockUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60000).toISOString();
        await ref.update({ failed_attempts: 0, locked_until: lockUntil });
        await logAudit({
          userName: 'System', role: 'system', action: 'lockout',
          entityType: 'doctor', entityId: doctor.id,
          description: `Doctor PIN entry locked for ${LOCKOUT_MINUTES} minutes after repeated failed attempts`,
        });
      } else {
        await ref.update({ failed_attempts: attempts });
      }
    })
  );

  throw new HttpsError('permission-denied', 'Invalid PIN');
}

exports.verifyDoctorPin = onCall(async (request) => {
  requireAuth(request);
  const doctor = await verifyDoctorPinCore(request.data?.pin);
  return { id: doctor.id, name: doctor.name, specialty: doctor.specialty || null, active: doctor.active };
});

// The core payment-verification flow: a doctor confirms an assistant-entered payment by
// entering only their PIN. Runs entirely server-side so the PIN hash comparison and the
// resulting "verified by" attribution can never be forged from the client.
exports.verifyPayment = onCall(async (request) => {
  requireAuth(request);
  const { paymentId, pin } = request.data || {};
  if (!paymentId) throw new HttpsError('invalid-argument', 'paymentId is required');

  const paymentRef = db.collection('payments').doc(paymentId);
  const paymentDoc = await paymentRef.get();
  if (!paymentDoc.exists) throw new HttpsError('not-found', 'Payment not found');
  const payment = paymentDoc.data();
  if (payment.status === 'verified') throw new HttpsError('failed-precondition', 'Payment already verified');

  const doctor = await verifyDoctorPinCore(pin);
  const verifiedAt = new Date().toISOString();
  await paymentRef.update({ status: 'verified', verified_by_doctor_id: doctor.id, verified_at: verifiedAt });

  const patientDoc = await db.collection('patients').doc(payment.patient_id).get();
  const patient = patientDoc.exists ? patientDoc.data() : null;

  await logAudit({
    userName: doctor.name, role: 'dentist', action: 'verify',
    entityType: 'payment', entityId: paymentId, patientId: payment.patient_id,
    description: `Payment of PHP ${Number(payment.amount_paid).toLocaleString()} for ${patient?.first_name || ''} ${patient?.last_name || ''} verified by ${doctor.name}`,
  });

  return {
    id: paymentId, status: 'verified',
    verified_by_doctor_id: doctor.id, verified_by_doctor_name: doctor.name, verified_at: verifiedAt,
  };
});

exports.createDoctor = onCall(async (request) => {
  requireAuth(request);
  const { name, specialty, pin } = request.data || {};
  if (!name || !pin) throw new HttpsError('invalid-argument', 'name and pin are required');
  if (!/^\d{4,6}$/.test(String(pin))) throw new HttpsError('invalid-argument', 'PIN must be 4-6 digits');

  const ref = db.collection('doctors').doc();
  const created_at = new Date().toISOString();
  await ref.set({ name, specialty: specialty || null, active: true, created_at });

  const { hash, salt } = hashPin(pin);
  await db.collection('doctor_secrets').doc(ref.id).set({ pin_hash: hash, pin_salt: salt, failed_attempts: 0, locked_until: null });

  return { id: ref.id, name, specialty: specialty || null, active: true, created_at };
});

exports.updateDoctor = onCall(async (request) => {
  requireAuth(request);
  const { doctorId, name, specialty, active, pin } = request.data || {};
  if (!doctorId) throw new HttpsError('invalid-argument', 'doctorId is required');

  const ref = db.collection('doctors').doc(doctorId);
  const doc = await ref.get();
  if (!doc.exists) throw new HttpsError('not-found', 'Doctor not found');
  const existing = doc.data();

  const update = {
    name: name ?? existing.name,
    specialty: specialty ?? existing.specialty,
    active: active === undefined ? existing.active : !!active,
  };
  await ref.update(update);

  if (pin) {
    if (!/^\d{4,6}$/.test(String(pin))) throw new HttpsError('invalid-argument', 'PIN must be 4-6 digits');
    const { hash, salt } = hashPin(pin);
    await db.collection('doctor_secrets').doc(doctorId).set({ pin_hash: hash, pin_salt: salt, failed_attempts: 0, locked_until: null });
  }

  return { id: doctorId, ...update };
});

// Staff accounts (real Firebase Auth logins) are only created by an existing admin - role
// is never self-assigned by the client.
exports.createStaffAccount = onCall(async (request) => {
  requireAuth(request);
  const callerDoc = await db.collection('staff').doc(request.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only an admin can create staff accounts');
  }

  const { email, password, name, role } = request.data || {};
  if (!email || !password || !name || !role) {
    throw new HttpsError('invalid-argument', 'email, password, name and role are required');
  }

  const userRecord = await getAuth().createUser({ email, password, displayName: name });
  const created_at = new Date().toISOString();
  await db.collection('staff').doc(userRecord.uid).set({ name, role, email, active: true, created_at });

  return { uid: userRecord.uid, name, role, email, active: true, created_at };
});

// Note: audit logging for ordinary CRUD (patients, treatments, tooth records, medical
// history, consent prepared/signed) is written directly by the frontend api/*.ts modules
// rather than by Firestore triggers here. Firestore-triggered functions proved unreliable
// in the local emulator on this setup (every onDocumentCreated/onDocumentUpdated
// invocation failed with an opaque runtime error, while onCall functions worked fine) -
// so the security-critical paths (PIN checks, payment verification, staff creation, doctor
// lockout) stay server-side in this file, and the lower-stakes activity log is written
// client-side, same trust level as this app already had before Cloud Functions existed.
