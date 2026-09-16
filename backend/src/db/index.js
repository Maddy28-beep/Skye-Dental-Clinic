import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'dental.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  patient_code TEXT UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  nickname TEXT,
  dob TEXT,
  sex TEXT,
  civil_status TEXT,
  religion TEXT,
  nationality TEXT,
  contact_number TEXT,
  office_number TEXT,
  email TEXT,
  address TEXT,
  occupation TEXT,
  dental_insurance TEXT,
  insurance_effective_date TEXT,
  referral_source TEXT,
  reason_for_consultation TEXT,
  guardian_name TEXT,
  guardian_occupation TEXT,
  emergency_contact_name TEXT,
  emergency_contact_number TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS medical_histories (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  conditions_json TEXT NOT NULL DEFAULT '{}',
  allergies TEXT,
  current_medications TEXT,
  previous_hospitalization TEXT,
  previous_surgeries TEXT,
  is_pregnant INTEGER DEFAULT 0,
  is_nursing INTEGER DEFAULT 0,
  taking_birth_control INTEGER DEFAULT 0,
  physician_name TEXT,
  physician_contact TEXT,
  physician_office_address TEXT,
  physician_office_number TEXT,
  dental_conditions_json TEXT NOT NULL DEFAULT '{}',
  last_dental_visit TEXT,
  previous_dentist TEXT,
  oral_hygiene_notes TEXT,
  in_good_health INTEGER,
  under_medical_treatment INTEGER,
  medical_treatment_detail TEXT,
  ever_hospitalized_detail TEXT,
  ever_serious_illness_detail TEXT,
  uses_tobacco INTEGER,
  uses_alcohol_or_drugs INTEGER,
  allergy_local_anesthetic INTEGER,
  allergy_penicillin INTEGER,
  allergy_antibiotics INTEGER,
  allergy_sulfa_drugs INTEGER,
  allergy_aspirin INTEGER,
  allergy_latex INTEGER,
  allergy_others TEXT,
  bleeding_time TEXT,
  blood_type TEXT,
  blood_pressure TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dental_exams (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  periodontal_json TEXT NOT NULL DEFAULT '{}',
  occlusion_json TEXT NOT NULL DEFAULT '{}',
  appliances_json TEXT NOT NULL DEFAULT '{}',
  tmd_json TEXT NOT NULL DEFAULT '{}',
  xray_json TEXT NOT NULL DEFAULT '{}',
  recorded_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tooth_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number TEXT NOT NULL,
  condition TEXT NOT NULL,
  existing_treatment TEXT,
  planned_treatment TEXT,
  notes TEXT,
  dentist_id TEXT REFERENCES doctors(id),
  recorded_by TEXT,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id),
  assistant_name TEXT,
  tooth_numbers_json TEXT NOT NULL DEFAULT '[]',
  procedure_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  cost REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  final_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  visit_date TEXT NOT NULL DEFAULT (date('now')),
  next_appointment_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id TEXT REFERENCES treatments(id) ON DELETE SET NULL,
  amount_due REAL NOT NULL DEFAULT 0,
  amount_paid REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  recorded_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_by_doctor_id TEXT REFERENCES doctors(id),
  verified_at TEXT,
  payment_date TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id TEXT REFERENCES treatments(id) ON DELETE SET NULL,
  template TEXT NOT NULL DEFAULT 'general',
  procedure_name TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  sections_json TEXT,
  anesthesia_json TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  signature_data TEXT,
  signed_name TEXT,
  witness_name TEXT,
  guardian_name TEXT,
  dentist_id TEXT REFERENCES doctors(id),
  status TEXT NOT NULL DEFAULT 'draft',
  signed_at TEXT,
  superseded_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  patient_id TEXT,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_medhist_patient ON medical_histories(patient_id);
CREATE INDEX IF NOT EXISTS idx_examhist_patient ON dental_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_tooth_patient ON tooth_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_patient ON consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_patient ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_treatment ON payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_logs(patient_id);
`);

export function hashPin(pin, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(String(pin), salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPin(pin, salt, expectedHash) {
  const { hash } = hashPin(pin, salt);
  return hash === expectedHash;
}

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Shared PIN lookup: given only a PIN (never a doctor id), finds which active doctor it
// belongs to. Used both for standalone PIN verification and for payment verification, so
// lockout/attempt state stays consistent across both entry points.
export function verifyDoctorPin(pin) {
  if (!pin) return { error: { status: 400, message: 'pin is required' } };

  const now = new Date();
  const doctors = db.prepare('SELECT * FROM doctors WHERE active = 1').all();
  const isLocked = (d) => d.locked_until && new Date(d.locked_until) > now;

  const match = doctors.find((d) => !isLocked(d) && verifyPin(pin, d.pin_salt, d.pin_hash));
  if (match) {
    db.prepare('UPDATE doctors SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(match.id);
    return { doctor: match };
  }

  const unlocked = doctors.filter((d) => !isLocked(d));
  if (doctors.length > 0 && unlocked.length === 0) {
    return { error: { status: 423, message: 'Too many failed attempts. Try again later.' } };
  }

  for (const d of unlocked) {
    const attempts = d.failed_attempts + 1;
    if (attempts >= MAX_PIN_ATTEMPTS) {
      const lockUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60000).toISOString();
      db.prepare('UPDATE doctors SET failed_attempts = 0, locked_until = ? WHERE id = ?').run(lockUntil, d.id);
      logAudit({
        userName: 'System', role: 'system', action: 'lockout',
        entityType: 'doctor', entityId: d.id,
        description: `Doctor PIN entry locked for ${LOCKOUT_MINUTES} minutes after repeated failed attempts`,
      });
    } else {
      db.prepare('UPDATE doctors SET failed_attempts = ? WHERE id = ?').run(attempts, d.id);
    }
  }

  return { error: { status: 401, message: 'Invalid PIN' } };
}

export function logAudit({ userName, role, action, entityType, entityId, patientId, description }) {
  db.prepare(
    `INSERT INTO audit_logs (id, user_name, role, action, entity_type, entity_id, patient_id, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomBytes(12).toString('hex'),
    userName || 'Unknown',
    role || 'staff',
    action,
    entityType,
    entityId || null,
    patientId || null,
    description
  );
}

// Guarantees at least one doctor account exists so the PIN-verification flow is never
// dead-ended on a completely fresh database (e.g. if the seed script hasn't been run yet).
const doctorCount = db.prepare('SELECT COUNT(*) as c FROM doctors').get().c;
if (doctorCount === 0) {
  const { hash, salt } = hashPin('0000');
  db.prepare(
    'INSERT INTO doctors (id, name, specialty, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)'
  ).run('doc_default', 'Dr. Default Dentist', 'General Dentistry', hash, salt);
}
