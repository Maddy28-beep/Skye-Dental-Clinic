import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, logAudit } from '../db/index.js';

const router = Router();

function serialize(row) {
  if (!row) return null;
  return {
    ...row,
    sections: row.sections_json ? JSON.parse(row.sections_json) : null,
    anesthesia: row.anesthesia_json ? JSON.parse(row.anesthesia_json) : null,
  };
}

router.get('/patient/:patientId', (req, res) => {
  const rows = db.prepare('SELECT * FROM consents WHERE patient_id = ? ORDER BY created_at DESC').all(req.params.patientId);
  res.json(rows.map(serialize));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM consents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Consent not found' });
  res.json(serialize(row));
});

// Create a draft consent (text/sections prepared, not yet signed). `template` distinguishes
// a general informed-consent form (per-section initials) from an oral surgery consent form
// (numbered risk list + anesthesia type selection) - see NewConsentForm on the frontend for
// the actual template content.
router.post('/', (req, res) => {
  const { patient_id, treatment_id, procedure_name, consent_text, template = 'general', sections, dentist_id, role, recorded_by } = req.body;
  if (!patient_id || !procedure_name || !consent_text) {
    return res.status(400).json({ error: 'patient_id, procedure_name and consent_text are required' });
  }
  const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(patient_id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const priorVersions = db.prepare(
    'SELECT MAX(version) as v FROM consents WHERE patient_id = ? AND procedure_name = ?'
  ).get(patient_id, procedure_name).v || 0;

  const id = nanoid();
  db.prepare(
    `INSERT INTO consents (id, patient_id, treatment_id, template, procedure_name, consent_text, sections_json, version, dentist_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  ).run(
    id, patient_id, treatment_id || null, template, procedure_name, consent_text,
    sections ? JSON.stringify(sections) : null, priorVersions + 1, dentist_id || null
  );

  logAudit({
    userName: recorded_by || 'Staff', role: role || 'assistant', action: 'create',
    entityType: 'consent', entityId: id, patientId: patient_id,
    description: `Consent form prepared for "${procedure_name}" (v${priorVersions + 1})`,
  });

  res.status(201).json(serialize(db.prepare('SELECT * FROM consents WHERE id = ?').get(id)));
});

// Sign a consent: captures the patient's signature and locks the record. Once signed, a
// consent is immutable - any later change must create a brand new version instead of
// overwriting this one, so the original signed record is always preserved for audit.
router.post('/:id/sign', (req, res) => {
  const existing = db.prepare('SELECT * FROM consents WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Consent not found' });
  if (existing.status === 'signed') return res.status(409).json({ error: 'Consent already signed and locked' });

  const { signature_data, signed_name, witness_name, guardian_name, sections, anesthesia } = req.body;
  if (!signature_data || !signed_name) {
    return res.status(400).json({ error: 'signature_data and signed_name are required' });
  }

  db.prepare(
    `UPDATE consents SET signature_data = ?, signed_name = ?, witness_name = ?, guardian_name = ?,
     sections_json = COALESCE(?, sections_json), anesthesia_json = ?,
     status = 'signed', signed_at = datetime('now') WHERE id = ?`
  ).run(
    signature_data, signed_name, witness_name || null, guardian_name || null,
    sections ? JSON.stringify(sections) : null, anesthesia ? JSON.stringify(anesthesia) : null,
    req.params.id
  );

  logAudit({
    userName: signed_name, role: 'patient', action: 'sign',
    entityType: 'consent', entityId: req.params.id, patientId: existing.patient_id,
    description: `Consent for "${existing.procedure_name}" signed by ${signed_name}`,
  });

  res.json(serialize(db.prepare('SELECT * FROM consents WHERE id = ?').get(req.params.id)));
});

// Supersede a signed consent with a fresh draft version (e.g. wording changed) rather than
// editing the signed one in place.
router.post('/:id/new-version', (req, res) => {
  const existing = db.prepare('SELECT * FROM consents WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Consent not found' });

  const { consent_text, sections, role, recorded_by } = req.body;
  const id = nanoid();
  db.prepare(
    `INSERT INTO consents (id, patient_id, treatment_id, template, procedure_name, consent_text, sections_json, version, dentist_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  ).run(
    id, existing.patient_id, existing.treatment_id, existing.template, existing.procedure_name,
    consent_text || existing.consent_text, sections ? JSON.stringify(sections) : existing.sections_json,
    existing.version + 1, existing.dentist_id
  );

  db.prepare('UPDATE consents SET superseded_by = ? WHERE id = ?').run(id, existing.id);

  logAudit({
    userName: recorded_by || 'Staff', role: role || 'assistant', action: 'create',
    entityType: 'consent', entityId: id, patientId: existing.patient_id,
    description: `New consent version (v${existing.version + 1}) created for "${existing.procedure_name}"`,
  });

  res.status(201).json(serialize(db.prepare('SELECT * FROM consents WHERE id = ?').get(id)));
});

export default router;
