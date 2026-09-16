import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, logAudit } from '../db/index.js';

const router = Router();

function serialize(row) {
  if (!row) return null;
  return { ...row, tooth_numbers: JSON.parse(row.tooth_numbers_json || '[]') };
}

router.get('/patient/:patientId', (req, res) => {
  const rows = db.prepare('SELECT * FROM treatments WHERE patient_id = ? ORDER BY visit_date DESC, created_at DESC').all(req.params.patientId);
  res.json(rows.map(serialize));
});

router.get('/', (req, res) => {
  const { status, from, to } = req.query;
  let sql = 'SELECT t.*, p.first_name, p.last_name FROM treatments t JOIN patients p ON p.id = t.patient_id WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (from) { sql += ' AND t.visit_date >= ?'; params.push(from); }
  if (to) { sql += ' AND t.visit_date <= ?'; params.push(to); }
  sql += ' ORDER BY t.visit_date DESC, t.created_at DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serialize));
});

router.post('/', (req, res) => {
  const {
    patient_id, doctor_id, assistant_name, tooth_numbers = [], procedure_name,
    description, status = 'planned', cost = 0, discount = 0, notes, visit_date,
    next_appointment_date, role,
  } = req.body;

  if (!patient_id || !procedure_name) {
    return res.status(400).json({ error: 'patient_id and procedure_name are required' });
  }
  const patient = db.prepare('SELECT id, first_name, last_name FROM patients WHERE id = ?').get(patient_id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const finalAmount = Math.max(0, Number(cost) - Number(discount || 0));
  const id = nanoid();
  db.prepare(
    `INSERT INTO treatments
     (id, patient_id, doctor_id, assistant_name, tooth_numbers_json, procedure_name, description, status, cost, discount, final_amount, notes, visit_date, next_appointment_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, date('now')), ?)`
  ).run(
    id, patient_id, doctor_id || null, assistant_name || null, JSON.stringify(tooth_numbers),
    procedure_name, description || null, status, cost, discount || 0, finalAmount, notes || null,
    visit_date || null, next_appointment_date || null
  );

  logAudit({
    userName: assistant_name || 'Staff', role: role || 'assistant', action: 'create',
    entityType: 'treatment', entityId: id, patientId: patient_id,
    description: `${procedure_name} recorded for ${patient.first_name} ${patient.last_name}`,
  });

  res.status(201).json(serialize(db.prepare('SELECT * FROM treatments WHERE id = ?').get(id)));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM treatments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Treatment not found' });

  const {
    doctor_id, assistant_name, tooth_numbers, procedure_name, description,
    status, cost, discount, notes, visit_date, next_appointment_date, recorded_by, role,
  } = req.body;

  const newCost = cost ?? existing.cost;
  const newDiscount = discount ?? existing.discount;
  const finalAmount = Math.max(0, Number(newCost) - Number(newDiscount));

  db.prepare(
    `UPDATE treatments SET doctor_id = ?, assistant_name = ?, tooth_numbers_json = ?, procedure_name = ?,
     description = ?, status = ?, cost = ?, discount = ?, final_amount = ?, notes = ?, visit_date = ?,
     next_appointment_date = ?
     WHERE id = ?`
  ).run(
    doctor_id ?? existing.doctor_id,
    assistant_name ?? existing.assistant_name,
    tooth_numbers ? JSON.stringify(tooth_numbers) : existing.tooth_numbers_json,
    procedure_name ?? existing.procedure_name,
    description ?? existing.description,
    status ?? existing.status,
    newCost, newDiscount, finalAmount,
    notes ?? existing.notes,
    visit_date ?? existing.visit_date,
    next_appointment_date ?? existing.next_appointment_date,
    req.params.id
  );

  logAudit({
    userName: recorded_by || 'Staff', role: role || 'assistant', action: 'update',
    entityType: 'treatment', entityId: req.params.id, patientId: existing.patient_id,
    description: `Treatment "${procedure_name ?? existing.procedure_name}" updated${status ? ` (status: ${status})` : ''}`,
  });

  res.json(serialize(db.prepare('SELECT * FROM treatments WHERE id = ?').get(req.params.id)));
});

export default router;
