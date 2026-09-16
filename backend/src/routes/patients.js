import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, logAudit } from '../db/index.js';

const router = Router();

const FIELDS = [
  'first_name', 'middle_name', 'last_name', 'nickname', 'dob', 'sex', 'civil_status', 'religion',
  'nationality', 'contact_number', 'office_number', 'email', 'address', 'occupation',
  'dental_insurance', 'insurance_effective_date', 'referral_source', 'reason_for_consultation',
  'guardian_name', 'guardian_occupation', 'emergency_contact_name', 'emergency_contact_number',
  'status', 'notes',
];

function nextPatientCode() {
  const year = new Date().getFullYear();
  const count = db.prepare("SELECT COUNT(*) as c FROM patients WHERE patient_code LIKE ?").get(`P${year}-%`).c;
  return `P${year}-${String(count + 1).padStart(4, '0')}`;
}

router.get('/', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q) {
    const like = `%${q}%`;
    rows = db.prepare(
      `SELECT * FROM patients WHERE first_name LIKE ? OR last_name LIKE ? OR contact_number LIKE ?
       ORDER BY created_at DESC`
    ).all(like, like, like);
  } else {
    rows = db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Patient not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { first_name, last_name } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'first_name and last_name are required' });
  }
  const id = nanoid();
  const code = nextPatientCode();
  const values = FIELDS.map((f) => req.body[f] ?? (f === 'status' ? 'active' : null));
  db.prepare(
    `INSERT INTO patients (id, patient_code, ${FIELDS.join(', ')}) VALUES (?, ?, ${FIELDS.map(() => '?').join(', ')})`
  ).run(id, code, ...values);
  logAudit({
    userName: req.body.recorded_by || 'Staff', role: req.body.role || 'assistant', action: 'create',
    entityType: 'patient', entityId: id, patientId: id,
    description: `New patient registered: ${first_name} ${last_name}`,
  });
  res.status(201).json(db.prepare('SELECT * FROM patients WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Patient not found' });
  const values = FIELDS.map((f) => req.body[f] ?? existing[f]);
  db.prepare(
    `UPDATE patients SET ${FIELDS.map((f) => `${f} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`
  ).run(...values, req.params.id);
  res.json(db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Chronological feed of everything that has happened for a patient, built by merging
// treatments, payments, consents and tooth updates rather than one big blended table.
router.get('/:id/timeline', (req, res) => {
  const { id } = req.params;
  const events = [];

  for (const t of db.prepare('SELECT * FROM treatments WHERE patient_id = ?').all(id)) {
    events.push({ type: 'treatment', at: t.created_at, title: t.procedure_name, detail: `Status: ${t.status}`, ref_id: t.id });
  }
  for (const p of db.prepare('SELECT * FROM payments WHERE patient_id = ?').all(id)) {
    events.push({ type: 'payment_recorded', at: p.created_at, title: `Payment recorded: PHP ${p.amount_paid}`, detail: `Recorded by ${p.recorded_by || 'staff'}`, ref_id: p.id });
    if (p.status === 'verified') {
      const doc = p.verified_by_doctor_id ? db.prepare('SELECT name FROM doctors WHERE id = ?').get(p.verified_by_doctor_id) : null;
      events.push({ type: 'payment_verified', at: p.verified_at, title: `Payment verified: PHP ${p.amount_paid}`, detail: `Verified by ${doc?.name || 'doctor'}`, ref_id: p.id });
    }
  }
  for (const c of db.prepare('SELECT * FROM consents WHERE patient_id = ?').all(id)) {
    events.push({ type: 'consent_created', at: c.created_at, title: `Consent prepared: ${c.procedure_name}`, detail: `Version ${c.version}`, ref_id: c.id });
    if (c.status === 'signed') {
      events.push({ type: 'consent_signed', at: c.signed_at, title: `Consent signed: ${c.procedure_name}`, detail: `Signed by ${c.signed_name}`, ref_id: c.id });
    }
  }
  for (const tr of db.prepare('SELECT * FROM tooth_records WHERE patient_id = ?').all(id)) {
    events.push({ type: 'tooth_update', at: tr.recorded_at, title: `Tooth #${tr.tooth_number}: ${tr.condition}`, detail: tr.notes || '', ref_id: tr.id });
  }
  const patient = db.prepare('SELECT created_at, first_name, last_name FROM patients WHERE id = ?').get(id);
  if (patient) {
    events.push({ type: 'patient_registered', at: patient.created_at, title: 'Patient registered', detail: `${patient.first_name} ${patient.last_name}`, ref_id: id });
  }

  events.sort((a, b) => new Date(b.at) - new Date(a.at));
  res.json(events);
});

export default router;
