// Seeds the LOCAL Firebase emulator suite with demo data so the app is explorable
// immediately. Run this only after `firebase emulators:start` is already running.
// Usage: node seed-emulator.js
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('node:crypto');

initializeApp({ projectId: 'skye-dental-demo' });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
const auth = getAuth();

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return { hash, salt };
}

async function addDoctor(name, specialty, pin) {
  const ref = db.collection('doctors').doc();
  await ref.set({ id: ref.id, name, specialty, active: true, created_at: new Date().toISOString() });
  const { hash, salt } = hashPin(pin);
  await db.collection('doctor_secrets').doc(ref.id).set({ pin_hash: hash, pin_salt: salt, failed_attempts: 0, locked_until: null });
  return ref.id;
}

async function addStaffAccount(email, password, name, role) {
  const user = await auth.createUser({ email, password, displayName: name });
  await db.collection('staff').doc(user.uid).set({ name, role, email, active: true, created_at: new Date().toISOString() });
  return user.uid;
}

async function addPatient(fields, code) {
  const ref = db.collection('patients').doc();
  const now = new Date().toISOString();
  await ref.set({
    id: ref.id, patient_code: code, status: 'active', notes: null,
    created_by: 'Ana Reyes', created_by_role: 'assistant', created_at: now, updated_at: now,
    ...fields,
  });
  return ref.id;
}

async function main() {
  const existing = await db.collection('patients').limit(1).get();
  if (!existing.empty) {
    console.log('Seed skipped: patients already exist in the emulator.');
    return;
  }

  const drSantos = await addDoctor('Dr. Maria Santos', 'General Dentistry', '1234');
  const drReyes = await addDoctor('Dr. Carlos Reyes', 'Orthodontics', '5678');

  await addStaffAccount('ana@skyedental.test', 'password123', 'Ana Reyes', 'assistant');
  await addStaffAccount('maria.santos@skyedental.test', 'password123', 'Dr. Maria Santos', 'dentist');
  await addStaffAccount('carlos.reyes@skyedental.test', 'password123', 'Dr. Carlos Reyes', 'dentist');
  await addStaffAccount('admin@skyedental.test', 'password123', 'Clinic Admin', 'admin');

  const juan = await addPatient({
    first_name: 'Juan', middle_name: 'P.', last_name: 'Dela Cruz', nickname: 'Jun', dob: '1990-04-12', sex: 'Male',
    civil_status: 'Married', religion: 'Roman Catholic', nationality: 'Filipino',
    contact_number: '0917-123-4567', email: 'juan.delacruz@example.com', address: 'Davao City',
    occupation: 'Driver', dental_insurance: 'PhilHealth', insurance_effective_date: '2025-01-01',
    referral_source: 'Facebook Page', reason_for_consultation: 'Toothache, lower left molar',
    emergency_contact_name: 'Rosa Dela Cruz', emergency_contact_number: '0917-765-4321',
  }, 'P2026-0001');

  const maria = await addPatient({
    first_name: 'Maria', middle_name: 'L.', last_name: 'Reyes', nickname: 'Mai', dob: '1985-08-30', sex: 'Female',
    civil_status: 'Married', religion: 'Roman Catholic', nationality: 'Filipino',
    contact_number: '0918-222-3333', email: 'maria.reyes@example.com', address: 'Toril, Davao City',
    occupation: 'Teacher', referral_source: 'Walk-in', reason_for_consultation: 'Routine cleaning',
    emergency_contact_name: 'Pedro Reyes', emergency_contact_number: '0918-444-5555',
    notes: 'Slightly anxious about needles.',
  }, 'P2026-0002');

  const pedro = await addPatient({
    first_name: 'Pedro', last_name: 'Santos', nickname: 'Pedring', dob: '2012-01-15', sex: 'Male',
    nationality: 'Filipino', contact_number: '0919-555-1111', address: 'Buhangin, Davao City',
    occupation: 'Student', referral_source: 'Referred by Juan Dela Cruz', reason_for_consultation: 'Initial checkup',
    guardian_name: 'Ana Santos', guardian_occupation: 'Accountant',
    emergency_contact_name: 'Ana Santos', emergency_contact_number: '0919-555-2222',
    notes: 'Pediatric patient.',
  }, 'P2026-0003');

  const ana = await addPatient({
    first_name: 'Ana', middle_name: 'B.', last_name: 'Lim', nickname: 'Anna', dob: '1995-11-02', sex: 'Female',
    civil_status: 'Single', nationality: 'Filipino',
    contact_number: '0920-777-8888', email: 'ana.lim@example.com', address: 'Matina, Davao City',
    occupation: 'Nurse', referral_source: 'Instagram', reason_for_consultation: 'Cavity filling',
    emergency_contact_name: 'Ben Lim', emergency_contact_number: '0920-999-0000',
  }, 'P2026-0004');

  // The app assigns patient_code via a transactional counter (counters/patients_{year});
  // seed data assigns codes directly instead, so the counter must be primed here too or
  // the first patient created through the UI would collide with P2026-0004 above.
  await db.collection('counters').doc(`patients_${new Date().getFullYear()}`).set({ count: 4 });

  await db.collection('medical_histories').doc(juan).set({
    id: juan, patient_id: juan,
    conditions: { hypertension: true }, dental_conditions: { previous_extraction: true },
    allergies: 'Penicillin', allergy_penicillin: true, current_medications: 'Losartan 50mg daily',
    previous_surgeries: 'Appendectomy (2015)', in_good_health: false, under_medical_treatment: true,
    medical_treatment_detail: 'Hypertension maintenance', last_dental_visit: '2026-03-10',
    previous_dentist: 'Dr. Luz Fernandez', oral_hygiene_notes: 'Brushes twice daily, occasional bleeding gums.',
    blood_type: 'O+', blood_pressure: '140/90', is_pregnant: false, is_nursing: false, taking_birth_control: false,
    updated_at: new Date().toISOString(),
  });

  await db.collection('medical_histories').doc(maria).set({
    id: maria, patient_id: maria,
    conditions: { asthma: true }, dental_conditions: { root_canal: true, orthodontic_treatment: true },
    current_medications: 'Salbutamol inhaler (as needed)', last_dental_visit: '2026-06-22',
    oral_hygiene_notes: 'Good oral hygiene.', blood_type: 'A+', blood_pressure: '110/70',
    in_good_health: true, is_pregnant: false, is_nursing: false, taking_birth_control: false,
    updated_at: new Date().toISOString(),
  });

  async function addTooth(patientId, tooth, condition, existing, planned, notes, dentistId) {
    const ref = db.collection('tooth_records').doc();
    await ref.set({
      id: ref.id, patient_id: patientId, tooth_number: tooth, condition,
      existing_treatment: existing, planned_treatment: planned, notes,
      dentist_id: dentistId, recorded_by: 'Ana Reyes', recorded_at: new Date().toISOString(),
    });
  }
  await addTooth(juan, '36', 'decayed', null, 'Amalgam Filling', 'Patient reports sensitivity to cold.', drSantos);
  await addTooth(juan, '46', 'amalgam_filling', 'Amalgam filling (2023)', null, null, drSantos);
  await addTooth(maria, '11', 'jacket_crown', 'Porcelain jacket crown (2024)', null, 'Monitor for wear.', drReyes);
  await addTooth(maria, '18', 'missing_other', null, null, 'Extracted prior to consult, unrelated to caries.', drReyes);

  await db.collection('dental_exams').doc(juan).set({
    id: juan, patient_id: juan,
    periodontal: { gingivitis: true },
    occlusion: { class_molar: 'Class I', overjet: false, overbite: false, midline_deviation: false, crossbite: false },
    appliances: { orthodontic: false, stayplate: false },
    tmd: { clenching: true, clicking: false, trismus: false, muscle_spasm: false },
    xray: { periapical: true, periapical_teeth: '36', panoramic: false },
    recorded_by: 'Dr. Maria Santos', updated_at: new Date().toISOString(),
  });

  async function addTreatment(patientId, doctorId, procedure, status, cost, discount, toothNumbers, visitDate, nextAppt) {
    const ref = db.collection('treatments').doc();
    await ref.set({
      id: ref.id, patient_id: patientId, doctor_id: doctorId, assistant_name: 'Ana Reyes',
      tooth_numbers: toothNumbers, procedure_name: procedure, description: null, status,
      cost, discount, final_amount: cost - discount, notes: null, visit_date: visitDate,
      next_appointment_date: nextAppt || null,
      created_by: 'Ana Reyes', created_by_role: 'assistant', created_at: new Date().toISOString(),
    });
    return ref.id;
  }

  const juanExtraction = await addTreatment(juan, drSantos, 'Tooth Extraction', 'completed', 1500, 0, ['36'], '2026-09-14', null);
  const mariaCleaning = await addTreatment(maria, drReyes, 'Dental Cleaning', 'completed', 800, 0, [], '2026-09-15', '2027-03-15');
  await addTreatment(pedro, drSantos, 'Consultation', 'completed', 300, 0, [], '2026-09-10', '2026-10-10');
  const anaFilling = await addTreatment(ana, drSantos, 'Tooth Filling', 'in_progress', 2000, 200, ['24'], '2026-09-16', '2026-09-23');

  async function addPayment(patientId, treatmentId, due, paid, method, status, verifiedDoctorId, verifiedDoctorName) {
    const ref = db.collection('payments').doc();
    const balance = due - paid;
    await ref.set({
      id: ref.id, patient_id: patientId, treatment_id: treatmentId, amount_due: due, amount_paid: paid,
      balance, payment_method: method, recorded_by: 'Ana Reyes', created_by_role: 'assistant',
      status, verified_by_doctor_id: status === 'verified' ? verifiedDoctorId : null,
      verified_by_doctor_name: status === 'verified' ? verifiedDoctorName : null,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
      payment_date: '2026-09-16', created_at: new Date().toISOString(),
    });
    return ref.id;
  }
  await addPayment(juan, juanExtraction, 1500, 1500, 'cash', 'pending', null, null);
  await addPayment(maria, mariaCleaning, 800, 800, 'gcash', 'verified', drReyes, 'Dr. Carlos Reyes');
  await addPayment(ana, anaFilling, 1800, 1000, 'cash', 'pending', null, null);

  const SIGNATURE_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4//8/AwAI/AL+p5qgoAAAAABJRU5ErkJggg==';

  async function addGeneralConsent(patientId, treatmentId, procedure, dentistId, signed, signedName) {
    const initials = signed ? signedName.split(' ').map((n) => n[0]).join('') : undefined;
    const sections = [
      { key: 'treatment', label: 'Treatment to be Done', text: `I understand and consent to have "${procedure}" performed, including its risks, benefits, and cost, as explained to me.`, initials },
      { key: 'drugs', label: 'Drugs & Medications', text: 'I understand antibiotics, analgesics, and other medications can cause allergic reactions.', initials },
      { key: 'removal_teeth', label: 'Removal of Teeth', text: 'I understand the alternatives to and risks of tooth removal.', initials },
    ];
    const text = `${sections.map((s) => `${s.label.toUpperCase()}: ${s.text}`).join('\n\n')}\n\nI understand that dentistry is not an exact science and no dentist can guarantee results. I authorize the dental team to proceed with this treatment.`;
    const ref = db.collection('consents').doc();
    await ref.set({
      id: ref.id, patient_id: patientId, treatment_id: treatmentId, template: 'general',
      procedure_name: procedure, consent_text: text, sections, anesthesia: null, version: 1,
      signature_data: signed ? SIGNATURE_PLACEHOLDER : null, signed_name: signed ? signedName : null,
      witness_name: null, guardian_name: null, dentist_id: dentistId,
      status: signed ? 'signed' : 'draft', signed_at: signed ? new Date().toISOString() : null,
      superseded_by: null, created_by: 'Ana Reyes', created_by_role: 'assistant', created_at: new Date().toISOString(),
    });
  }
  await addGeneralConsent(juan, juanExtraction, 'Tooth Extraction', drSantos, true, 'Juan Dela Cruz');
  await addGeneralConsent(ana, anaFilling, 'Tooth Filling', drSantos, false, null);

  async function addAuditLog({ userName, role, action, entityType, entityId, patientId, description }) {
    const ref = db.collection('audit_logs').doc();
    await ref.set({
      id: ref.id, user_name: userName, role, action, entity_type: entityType,
      entity_id: entityId || null, patient_id: patientId || null, description,
      created_at: new Date().toISOString(),
    });
  }
  await addAuditLog({ userName: 'Ana Reyes', role: 'assistant', action: 'create', entityType: 'patient', entityId: ana, patientId: ana, description: 'New patient registered: Ana Lim' });
  await addAuditLog({ userName: 'Ana Reyes', role: 'assistant', action: 'create', entityType: 'treatment', entityId: anaFilling, patientId: ana, description: 'Tooth Filling recorded for Ana Lim' });
  await addAuditLog({ userName: 'Ana Reyes', role: 'assistant', action: 'create', entityType: 'payment', patientId: ana, description: 'Payment of PHP 1,000 recorded for Ana Lim, pending doctor verification' });
  await addAuditLog({ userName: 'Dr. Maria Santos', role: 'dentist', action: 'sign', entityType: 'consent', patientId: juan, description: 'Consent for "Tooth Extraction" signed by Juan Dela Cruz' });
  await addAuditLog({ userName: 'Dr. Carlos Reyes', role: 'dentist', action: 'verify', entityType: 'payment', patientId: maria, description: 'Payment of PHP 800 for Maria Reyes verified by Dr. Carlos Reyes' });
  await addAuditLog({ userName: 'Ana Reyes', role: 'assistant', action: 'create', entityType: 'payment', patientId: juan, description: 'Payment of PHP 1,500 recorded for Juan Dela Cruz, pending doctor verification' });

  console.log('Seed complete.');
  console.log('Demo doctor PINs -> Dr. Maria Santos: 1234, Dr. Carlos Reyes: 5678');
  console.log('Demo staff logins (password: password123):');
  console.log('  ana@skyedental.test (assistant)');
  console.log('  maria.santos@skyedental.test (dentist)');
  console.log('  carlos.reyes@skyedental.test (dentist)');
  console.log('  admin@skyedental.test (admin)');
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
