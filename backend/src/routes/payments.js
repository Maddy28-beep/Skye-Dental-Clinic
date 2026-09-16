import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, verifyDoctorPin, logAudit } from '../db/index.js';

const router = Router();

function serialize(row) {
  if (!row) return null;
  const doctor = row.verified_by_doctor_id
    ? db.prepare('SELECT id, name FROM doctors WHERE id = ?').get(row.verified_by_doctor_id)
    : null;
  return { ...row, verified_by_doctor_name: doctor?.name || null };
}

router.get('/patient/:patientId', (req, res) => {
  const rows = db.prepare(
    `SELECT pay.*, t.procedure_name FROM payments pay
     LEFT JOIN treatments t ON t.id = pay.treatment_id
     WHERE pay.patient_id = ? ORDER BY pay.created_at DESC`
  ).all(req.params.patientId);
  res.json(rows.map(serialize));
});

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT pay.*, p.first_name, p.last_name, t.procedure_name
             FROM payments pay
             JOIN patients p ON p.id = pay.patient_id
             LEFT JOIN treatments t ON t.id = pay.treatment_id
             WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND pay.status = ?'; params.push(status); }
  sql += ' ORDER BY pay.created_at DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params).map(serialize));
});

// Queue of payments an assistant recorded that a doctor still needs to confirm.
router.get('/pending', (req, res) => {
  const rows = db.prepare(
    `SELECT pay.*, p.first_name, p.last_name, t.procedure_name
     FROM payments pay
     JOIN patients p ON p.id = pay.patient_id
     LEFT JOIN treatments t ON t.id = pay.treatment_id
     WHERE pay.status = 'pending'
     ORDER BY pay.created_at ASC`
  ).all();
  res.json(rows.map(serialize));
});

router.post('/', (req, res) => {
  const { patient_id, treatment_id, amount_due = 0, amount_paid = 0, payment_method = 'cash', recorded_by, payment_date, role } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

  const patient = db.prepare('SELECT first_name, last_name FROM patients WHERE id = ?').get(patient_id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const balance = Math.max(0, Number(amount_due) - Number(amount_paid));
  const id = nanoid();
  db.prepare(
    `INSERT INTO payments (id, patient_id, treatment_id, amount_due, amount_paid, balance, payment_method, recorded_by, status, payment_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', COALESCE(?, date('now')))`
  ).run(id, patient_id, treatment_id || null, amount_due, amount_paid, balance, payment_method, recorded_by || null, payment_date || null);

  logAudit({
    userName: recorded_by || 'Staff', role: role || 'assistant', action: 'create',
    entityType: 'payment', entityId: id, patientId: patient_id,
    description: `Payment of PHP ${Number(amount_paid).toLocaleString()} recorded for ${patient.first_name} ${patient.last_name}, pending doctor verification`,
  });

  res.status(201).json(serialize(db.prepare('SELECT * FROM payments WHERE id = ?').get(id)));
});

// The core PIN-verification flow: a doctor confirms an assistant-entered payment by
// entering only their PIN. The PIN itself identifies the doctor - nothing in the request
// names one - so "Verified By" can never be spoofed to a different doctor's name.
router.post('/:id/verify', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status === 'verified') return res.status(409).json({ error: 'Payment already verified' });

  const { doctor, error } = verifyDoctorPin(req.body.pin);
  if (error) return res.status(error.status).json({ error: error.message });

  db.prepare(
    `UPDATE payments SET status = 'verified', verified_by_doctor_id = ?, verified_at = datetime('now') WHERE id = ?`
  ).run(doctor.id, req.params.id);

  const patient = db.prepare('SELECT first_name, last_name FROM patients WHERE id = ?').get(payment.patient_id);
  logAudit({
    userName: doctor.name, role: 'dentist', action: 'verify',
    entityType: 'payment', entityId: payment.id, patientId: payment.patient_id,
    description: `Payment of PHP ${Number(payment.amount_paid).toLocaleString()} for ${patient?.first_name} ${patient?.last_name} verified by ${doctor.name}`,
  });

  res.json(serialize(db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id)));
});

export default router;
