// Seeds realistic demo data so the app is immediately explorable.
// Safe to re-run: skips if patients already exist.
import { nanoid } from 'nanoid';
import { db, hashPin, logAudit } from './db/index.js';

const patientCount = db.prepare('SELECT COUNT(*) as c FROM patients').get().c;
if (patientCount > 0) {
  console.log('Seed skipped: patients already exist.');
  process.exit(0);
}

function addDoctor(name, specialty, pin) {
  const id = nanoid();
  const { hash, salt } = hashPin(pin);
  db.prepare('INSERT INTO doctors (id, name, specialty, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, specialty, hash, salt);
  return id;
}

const PATIENT_FIELDS = [
  'first_name', 'middle_name', 'last_name', 'nickname', 'dob', 'sex', 'civil_status', 'religion',
  'nationality', 'contact_number', 'office_number', 'email', 'address', 'occupation',
  'dental_insurance', 'insurance_effective_date', 'referral_source', 'reason_for_consultation',
  'guardian_name', 'guardian_occupation', 'emergency_contact_name', 'emergency_contact_number',
  'status', 'notes',
];

function addPatient(p, code) {
  const id = nanoid();
  const row = { id, code };
  for (const f of PATIENT_FIELDS) row[f] = p[f] ?? null;
  db.prepare(`
    INSERT INTO patients (id, patient_code, ${PATIENT_FIELDS.join(', ')})
    VALUES (@id, @code, ${PATIENT_FIELDS.map((f) => `@${f}`).join(', ')})
  `).run(row);
  return id;
}

const drSantos = addDoctor('Dr. Maria Santos', 'General Dentistry', '1234');
const drReyes = addDoctor('Dr. Carlos Reyes', 'Orthodontics', '5678');

const juan = addPatient({
  first_name: 'Juan', middle_name: 'P.', last_name: 'Dela Cruz', nickname: 'Jun', dob: '1990-04-12', sex: 'Male',
  civil_status: 'Married', religion: 'Roman Catholic', nationality: 'Filipino',
  contact_number: '0917-123-4567', email: 'juan.delacruz@example.com', address: 'Davao City',
  occupation: 'Driver', dental_insurance: 'PhilHealth', insurance_effective_date: '2025-01-01',
  referral_source: 'Facebook Page', reason_for_consultation: 'Toothache, lower left molar',
  emergency_contact_name: 'Rosa Dela Cruz', emergency_contact_number: '0917-765-4321',
  status: 'active', notes: null,
}, 'P2026-0001');

const maria = addPatient({
  first_name: 'Maria', middle_name: 'L.', last_name: 'Reyes', nickname: 'Mai', dob: '1985-08-30', sex: 'Female',
  civil_status: 'Married', religion: 'Roman Catholic', nationality: 'Filipino',
  contact_number: '0918-222-3333', email: 'maria.reyes@example.com', address: 'Toril, Davao City',
  occupation: 'Teacher', referral_source: 'Walk-in', reason_for_consultation: 'Routine cleaning',
  emergency_contact_name: 'Pedro Reyes', emergency_contact_number: '0918-444-5555',
  status: 'active', notes: 'Slightly anxious about needles.',
}, 'P2026-0002');

const pedro = addPatient({
  first_name: 'Pedro', middle_name: null, last_name: 'Santos', nickname: 'Pedring', dob: '2012-01-15', sex: 'Male',
  nationality: 'Filipino', contact_number: '0919-555-1111', address: 'Buhangin, Davao City',
  occupation: 'Student', referral_source: 'Referred by Juan Dela Cruz', reason_for_consultation: 'Initial checkup',
  guardian_name: 'Ana Santos', guardian_occupation: 'Accountant',
  emergency_contact_name: 'Ana Santos', emergency_contact_number: '0919-555-2222',
  status: 'active', notes: 'Pediatric patient.',
}, 'P2026-0003');

const ana = addPatient({
  first_name: 'Ana', middle_name: 'B.', last_name: 'Lim', nickname: 'Anna', dob: '1995-11-02', sex: 'Female',
  civil_status: 'Single', nationality: 'Filipino',
  contact_number: '0920-777-8888', email: 'ana.lim@example.com', address: 'Matina, Davao City',
  occupation: 'Nurse', referral_source: 'Instagram', reason_for_consultation: 'Cavity filling',
  emergency_contact_name: 'Ben Lim', emergency_contact_number: '0920-999-0000',
  status: 'active', notes: null,
}, 'P2026-0004');

// Medical & dental history
function addMedicalHistory(patientId, data) {
  db.prepare(`
    INSERT INTO medical_histories (
      id, patient_id, conditions_json, dental_conditions_json, allergies, current_medications,
      previous_hospitalization, previous_surgeries, is_pregnant, is_nursing, taking_birth_control,
      physician_name, physician_contact, physician_office_address, physician_office_number,
      last_dental_visit, previous_dentist, oral_hygiene_notes, in_good_health, under_medical_treatment,
      medical_treatment_detail, ever_hospitalized_detail, ever_serious_illness_detail, uses_tobacco,
      uses_alcohol_or_drugs, allergy_local_anesthetic, allergy_penicillin, allergy_antibiotics,
      allergy_sulfa_drugs, allergy_aspirin, allergy_latex, allergy_others, bleeding_time, blood_type,
      blood_pressure, notes
    ) VALUES (
      @id, @patient_id, @conditions_json, @dental_conditions_json, @allergies, @current_medications,
      @previous_hospitalization, @previous_surgeries, @is_pregnant, @is_nursing, @taking_birth_control,
      @physician_name, @physician_contact, @physician_office_address, @physician_office_number,
      @last_dental_visit, @previous_dentist, @oral_hygiene_notes, @in_good_health, @under_medical_treatment,
      @medical_treatment_detail, @ever_hospitalized_detail, @ever_serious_illness_detail, @uses_tobacco,
      @uses_alcohol_or_drugs, @allergy_local_anesthetic, @allergy_penicillin, @allergy_antibiotics,
      @allergy_sulfa_drugs, @allergy_aspirin, @allergy_latex, @allergy_others, @bleeding_time, @blood_type,
      @blood_pressure, @notes
    )
  `).run({
    id: nanoid(), patient_id: patientId,
    conditions_json: '{}', dental_conditions_json: '{}', allergies: null, current_medications: null,
    previous_hospitalization: null, previous_surgeries: null, is_pregnant: 0, is_nursing: 0, taking_birth_control: 0,
    physician_name: null, physician_contact: null, physician_office_address: null, physician_office_number: null,
    last_dental_visit: null, previous_dentist: null, oral_hygiene_notes: null, in_good_health: 1, under_medical_treatment: 0,
    medical_treatment_detail: null, ever_hospitalized_detail: null, ever_serious_illness_detail: null, uses_tobacco: 0,
    uses_alcohol_or_drugs: 0, allergy_local_anesthetic: 0, allergy_penicillin: 0, allergy_antibiotics: 0,
    allergy_sulfa_drugs: 0, allergy_aspirin: 0, allergy_latex: 0, allergy_others: null, bleeding_time: null, blood_type: null,
    blood_pressure: null, notes: null,
    ...data,
  });
}

addMedicalHistory(juan, {
  conditions_json: JSON.stringify({ hypertension: true, bleeding_problems: false }),
  dental_conditions_json: JSON.stringify({ previous_extraction: true, root_canal: false, orthodontic_treatment: false, dentures: false }),
  allergies: 'Penicillin', current_medications: 'Losartan 50mg daily', previous_surgeries: 'Appendectomy (2015)',
  allergy_penicillin: 1, in_good_health: 0, under_medical_treatment: 1, medical_treatment_detail: 'Hypertension maintenance',
  last_dental_visit: '2026-03-10', previous_dentist: 'Dr. Luz Fernandez', oral_hygiene_notes: 'Brushes twice daily, occasional bleeding gums.',
  blood_type: 'O+', blood_pressure: '140/90',
});

addMedicalHistory(maria, {
  conditions_json: JSON.stringify({ asthma: true }),
  dental_conditions_json: JSON.stringify({ previous_extraction: false, root_canal: true, orthodontic_treatment: true, dentures: false }),
  current_medications: 'Salbutamol inhaler (as needed)', allergy_others: null,
  last_dental_visit: '2026-06-22', oral_hygiene_notes: 'Good oral hygiene.',
  blood_type: 'A+', blood_pressure: '110/70',
});

// Tooth records (current state) - uses the PDA standard condition codes.
function addTooth(patientId, tooth, condition, existing, planned, notes, dentistId) {
  db.prepare(`
    INSERT INTO tooth_records (id, patient_id, tooth_number, condition, existing_treatment, planned_treatment, notes, dentist_id, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nanoid(), patientId, tooth, condition, existing, planned, notes, dentistId, 'Ana Reyes');
}
addTooth(juan, '36', 'decayed', null, 'Amalgam Filling', 'Patient reports sensitivity to cold.', drSantos);
addTooth(juan, '46', 'amalgam_filling', 'Amalgam filling (2023)', null, null, drSantos);
addTooth(maria, '11', 'jacket_crown', 'Porcelain jacket crown (2024)', null, 'Monitor for wear.', drReyes);
addTooth(maria, '18', 'missing_other', null, null, 'Extracted prior to consult, unrelated to caries.', drReyes);

// Intraoral examination findings (Periodontal / Occlusion / Appliances / TMD / X-ray)
db.prepare(`
  INSERT INTO dental_exams (id, patient_id, periodontal_json, occlusion_json, appliances_json, tmd_json, xray_json, recorded_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  nanoid(), juan,
  JSON.stringify({ gingivitis: true }),
  JSON.stringify({ class_molar: 'Class I', overjet: false, overbite: false, midline_deviation: false, crossbite: false }),
  JSON.stringify({ orthodontic: false, stayplate: false }),
  JSON.stringify({ clenching: true, clicking: false, trismus: false, muscle_spasm: false }),
  JSON.stringify({ periapical: true, periapical_teeth: '36', panoramic: false }),
  'Dr. Maria Santos'
);

// Treatments
function addTreatment(patientId, doctorId, procedure, status, cost, discount, toothNumbers, visitDate, nextAppt) {
  const id = nanoid();
  const finalAmount = cost - discount;
  db.prepare(`
    INSERT INTO treatments (id, patient_id, doctor_id, assistant_name, tooth_numbers_json, procedure_name, description, status, cost, discount, final_amount, notes, visit_date, next_appointment_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, patientId, doctorId, 'Ana Reyes', JSON.stringify(toothNumbers), procedure, null, status, cost, discount, finalAmount, null, visitDate, nextAppt || null);
  return id;
}

const juanExtraction = addTreatment(juan, drSantos, 'Tooth Extraction', 'completed', 1500, 0, ['36'], '2026-09-14', null);
const mariaCleaning = addTreatment(maria, drReyes, 'Dental Cleaning', 'completed', 800, 0, [], '2026-09-15', '2027-03-15');
addTreatment(pedro, drSantos, 'Consultation', 'completed', 300, 0, [], '2026-09-10', '2026-10-10');
const anaFilling = addTreatment(ana, drSantos, 'Tooth Filling', 'in_progress', 2000, 200, ['24'], '2026-09-16', '2026-09-23');

// Payments - a mix of pending and verified so the demo shows both states.
function addPayment(patientId, treatmentId, due, paid, method, status, verifiedDoctorId) {
  const id = nanoid();
  const balance = due - paid;
  if (status === 'verified') {
    db.prepare(`
      INSERT INTO payments (id, patient_id, treatment_id, amount_due, amount_paid, balance, payment_method, recorded_by, status, verified_by_doctor_id, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Ana Reyes', 'verified', ?, datetime('now'))
    `).run(id, patientId, treatmentId, due, paid, balance, method, verifiedDoctorId);
  } else {
    db.prepare(`
      INSERT INTO payments (id, patient_id, treatment_id, amount_due, amount_paid, balance, payment_method, recorded_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Ana Reyes', 'pending')
    `).run(id, patientId, treatmentId, due, paid, balance, method);
  }
  return id;
}

addPayment(juan, juanExtraction, 1500, 1500, 'cash', 'pending', null);
addPayment(maria, mariaCleaning, 800, 800, 'gcash', 'verified', drReyes);
addPayment(ana, anaFilling, 1800, 1000, 'cash', 'pending', null);

// Consents - one signed "general" consent (per-section initials) and one signed "oral
// surgery" consent (risk list + anesthesia choice + witness), plus a draft awaiting signature.
// A genuinely transparent 1x1 PNG (verified via a manual PNG encode) - a real signature is
// captured through the on-screen SignaturePad; this only backs the seeded demo record.
const SIGNATURE_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4//8/AwAI/AL+p5qgoAAAAABJRU5ErkJggg==';

function addGeneralConsent(patientId, treatmentId, procedure, dentistId, signed, signedName) {
  const sections = [
    { key: 'treatment', label: 'Treatment to be Done', text: `I understand and consent to have "${procedure}" performed, including its risks, benefits, and cost, as explained to me.`, initials: signed ? signedName.split(' ').map((n) => n[0]).join('') : undefined },
    { key: 'drugs', label: 'Drugs & Medications', text: 'I understand antibiotics, analgesics, and other medications can cause allergic reactions.', initials: signed ? signedName.split(' ').map((n) => n[0]).join('') : undefined },
    { key: 'removal_teeth', label: 'Removal of Teeth', text: 'I understand the alternatives to and risks of tooth removal.', initials: signed ? signedName.split(' ').map((n) => n[0]).join('') : undefined },
  ];
  const text = `${sections.map((s) => `${s.label.toUpperCase()}: ${s.text}`).join('\n\n')}\n\nI understand that dentistry is not an exact science and no dentist can guarantee results. I authorize the dental team to proceed with this treatment.`;
  const id = nanoid();
  if (signed) {
    db.prepare(`
      INSERT INTO consents (id, patient_id, treatment_id, template, procedure_name, consent_text, sections_json, version, signature_data, signed_name, dentist_id, status, signed_at)
      VALUES (?, ?, ?, 'general', ?, ?, ?, 1, ?, ?, ?, 'signed', datetime('now'))
    `).run(id, patientId, treatmentId, procedure, text, JSON.stringify(sections), SIGNATURE_PLACEHOLDER, signedName, dentistId);
  } else {
    db.prepare(`
      INSERT INTO consents (id, patient_id, treatment_id, template, procedure_name, consent_text, sections_json, version, dentist_id, status)
      VALUES (?, ?, ?, 'general', ?, ?, ?, 1, ?, 'draft')
    `).run(id, patientId, treatmentId, procedure, text, JSON.stringify(sections.map((s) => ({ ...s, initials: undefined }))), dentistId);
  }
  return id;
}

addGeneralConsent(juan, juanExtraction, 'Tooth Extraction', drSantos, true, 'Juan Dela Cruz');
addGeneralConsent(ana, anaFilling, 'Tooth Filling', drSantos, false, null);

console.log('Seed complete.');
console.log('Demo doctor PINs -> Dr. Maria Santos: 1234, Dr. Carlos Reyes: 5678');

// Audit trail entries so the dashboard's "Recent Activity" isn't empty on first load.
logAudit({ userName: 'Ana Reyes', role: 'assistant', action: 'create', entityType: 'patient', entityId: ana, patientId: ana, description: 'New patient registered: Ana Lim' });
logAudit({ userName: 'Ana Reyes', role: 'assistant', action: 'create', entityType: 'treatment', entityId: anaFilling, patientId: ana, description: 'Tooth Filling recorded for Ana Lim' });
logAudit({ userName: 'Ana Reyes', role: 'assistant', action: 'create', entityType: 'payment', entityId: null, patientId: ana, description: 'Payment of PHP 1,000 recorded for Ana Lim, pending doctor verification' });
logAudit({ userName: 'Dr. Maria Santos', role: 'dentist', action: 'sign', entityType: 'consent', entityId: null, patientId: juan, description: 'Consent for "Tooth Extraction" signed by Juan Dela Cruz' });
logAudit({ userName: 'Dr. Carlos Reyes', role: 'dentist', action: 'verify', entityType: 'payment', entityId: null, patientId: maria, description: 'Payment of PHP 800 for Maria Reyes verified by Dr. Carlos Reyes' });
logAudit({ userName: 'Ana Reyes', role: 'assistant', action: 'create', entityType: 'payment', entityId: null, patientId: juan, description: 'Payment of PHP 1,500 recorded for Juan Dela Cruz, pending doctor verification' });
