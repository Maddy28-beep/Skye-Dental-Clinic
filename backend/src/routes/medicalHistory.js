import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, logAudit } from '../db/index.js';

const router = Router();

// Flags stored as 0/1 in SQLite but exposed as booleans to the frontend.
const BOOLEAN_FIELDS = [
  'is_pregnant', 'is_nursing', 'taking_birth_control', 'in_good_health', 'under_medical_treatment',
  'uses_tobacco', 'uses_alcohol_or_drugs', 'allergy_local_anesthetic', 'allergy_penicillin',
  'allergy_antibiotics', 'allergy_sulfa_drugs', 'allergy_aspirin', 'allergy_latex',
];

const TEXT_FIELDS = [
  'allergies', 'current_medications', 'previous_hospitalization', 'previous_surgeries',
  'physician_name', 'physician_contact', 'physician_office_address', 'physician_office_number',
  'last_dental_visit', 'previous_dentist', 'oral_hygiene_notes', 'medical_treatment_detail',
  'ever_hospitalized_detail', 'ever_serious_illness_detail', 'allergy_others', 'bleeding_time',
  'blood_type', 'blood_pressure', 'notes',
];

function serialize(row) {
  if (!row) return null;
  const out = {
    ...row,
    conditions: JSON.parse(row.conditions_json || '{}'),
    dental_conditions: JSON.parse(row.dental_conditions_json || '{}'),
  };
  for (const f of BOOLEAN_FIELDS) out[f] = !!row[f];
  return out;
}

router.get('/patient/:patientId', (req, res) => {
  const row = db.prepare('SELECT * FROM medical_histories WHERE patient_id = ?').get(req.params.patientId);
  res.json(serialize(row));
});

router.put('/patient/:patientId', (req, res) => {
  const { patientId } = req.params;
  const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const body = req.body;
  const conditionsJson = JSON.stringify(body.conditions ?? {});
  const dentalJson = JSON.stringify(body.dental_conditions ?? {});

  const existing = db.prepare('SELECT id FROM medical_histories WHERE patient_id = ?').get(patientId);

  const textValues = TEXT_FIELDS.map((f) => body[f] ?? null);
  const boolValues = BOOLEAN_FIELDS.map((f) => (body[f] ? 1 : 0));

  if (existing) {
    db.prepare(
      `UPDATE medical_histories SET conditions_json = ?, dental_conditions_json = ?,
       ${TEXT_FIELDS.map((f) => `${f} = ?`).join(', ')}, ${BOOLEAN_FIELDS.map((f) => `${f} = ?`).join(', ')},
       updated_at = datetime('now') WHERE patient_id = ?`
    ).run(conditionsJson, dentalJson, ...textValues, ...boolValues, patientId);
  } else {
    db.prepare(
      `INSERT INTO medical_histories
       (id, patient_id, conditions_json, dental_conditions_json, ${TEXT_FIELDS.join(', ')}, ${BOOLEAN_FIELDS.join(', ')})
       VALUES (?, ?, ?, ?, ${TEXT_FIELDS.map(() => '?').join(', ')}, ${BOOLEAN_FIELDS.map(() => '?').join(', ')})`
    ).run(nanoid(), patientId, conditionsJson, dentalJson, ...textValues, ...boolValues);
  }

  logAudit({
    userName: body.recorded_by || 'Staff', role: body.role || 'assistant', action: 'update',
    entityType: 'medical_history', entityId: patientId, patientId,
    description: 'Medical & dental history updated',
  });

  const row = db.prepare('SELECT * FROM medical_histories WHERE patient_id = ?').get(patientId);
  res.json(serialize(row));
});

export default router;
