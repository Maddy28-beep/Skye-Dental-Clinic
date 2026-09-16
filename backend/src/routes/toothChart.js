import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, logAudit } from '../db/index.js';

const router = Router();

// Current state of every tooth for a patient: the latest record per tooth number.
router.get('/patient/:patientId/current', (req, res) => {
  const rows = db.prepare(
    `SELECT tr.* FROM tooth_records tr
     INNER JOIN (
       SELECT tooth_number, MAX(recorded_at) as latest FROM tooth_records WHERE patient_id = ? GROUP BY tooth_number
     ) latest_tr ON tr.tooth_number = latest_tr.tooth_number AND tr.recorded_at = latest_tr.latest
     WHERE tr.patient_id = ?`
  ).all(req.params.patientId, req.params.patientId);
  res.json(rows);
});

// Full history for a single tooth, or all teeth, for a patient.
router.get('/patient/:patientId/history', (req, res) => {
  const { tooth } = req.query;
  const rows = tooth
    ? db.prepare('SELECT * FROM tooth_records WHERE patient_id = ? AND tooth_number = ? ORDER BY recorded_at DESC').all(req.params.patientId, tooth)
    : db.prepare('SELECT * FROM tooth_records WHERE patient_id = ? ORDER BY recorded_at DESC').all(req.params.patientId);
  res.json(rows);
});

router.post('/patient/:patientId', (req, res) => {
  const { patientId } = req.params;
  const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const { tooth_number, condition, existing_treatment, planned_treatment, notes, dentist_id, recorded_by } = req.body;
  if (!tooth_number || !condition) {
    return res.status(400).json({ error: 'tooth_number and condition are required' });
  }

  const id = nanoid();
  db.prepare(
    `INSERT INTO tooth_records (id, patient_id, tooth_number, condition, existing_treatment, planned_treatment, notes, dentist_id, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, patientId, tooth_number, condition, existing_treatment || null, planned_treatment || null, notes || null, dentist_id || null, recorded_by || null);

  logAudit({
    userName: recorded_by || 'Staff', role: req.body.role || 'dentist', action: 'update',
    entityType: 'tooth_record', entityId: id, patientId,
    description: `Tooth #${tooth_number} updated to "${condition}"`,
  });

  res.status(201).json(db.prepare('SELECT * FROM tooth_records WHERE id = ?').get(id));
});

export default router;
