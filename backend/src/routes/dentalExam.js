import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, logAudit } from '../db/index.js';

const router = Router();

function serialize(row) {
  if (!row) return null;
  return {
    ...row,
    periodontal: JSON.parse(row.periodontal_json || '{}'),
    occlusion: JSON.parse(row.occlusion_json || '{}'),
    appliances: JSON.parse(row.appliances_json || '{}'),
    tmd: JSON.parse(row.tmd_json || '{}'),
    xray: JSON.parse(row.xray_json || '{}'),
  };
}

router.get('/patient/:patientId', (req, res) => {
  const row = db.prepare('SELECT * FROM dental_exams WHERE patient_id = ?').get(req.params.patientId);
  res.json(serialize(row));
});

router.put('/patient/:patientId', (req, res) => {
  const { patientId } = req.params;
  const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const { periodontal = {}, occlusion = {}, appliances = {}, tmd = {}, xray = {}, recorded_by, role } = req.body;
  const existing = db.prepare('SELECT id FROM dental_exams WHERE patient_id = ?').get(patientId);

  const periodontalJson = JSON.stringify(periodontal);
  const occlusionJson = JSON.stringify(occlusion);
  const appliancesJson = JSON.stringify(appliances);
  const tmdJson = JSON.stringify(tmd);
  const xrayJson = JSON.stringify(xray);

  if (existing) {
    db.prepare(
      `UPDATE dental_exams SET periodontal_json = ?, occlusion_json = ?, appliances_json = ?, tmd_json = ?,
       xray_json = ?, recorded_by = ?, updated_at = datetime('now') WHERE patient_id = ?`
    ).run(periodontalJson, occlusionJson, appliancesJson, tmdJson, xrayJson, recorded_by || null, patientId);
  } else {
    db.prepare(
      `INSERT INTO dental_exams (id, patient_id, periodontal_json, occlusion_json, appliances_json, tmd_json, xray_json, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(nanoid(), patientId, periodontalJson, occlusionJson, appliancesJson, tmdJson, xrayJson, recorded_by || null);
  }

  logAudit({
    userName: recorded_by || 'Staff', role: role || 'dentist', action: 'update',
    entityType: 'dental_exam', entityId: patientId, patientId,
    description: 'Intraoral examination findings updated',
  });

  const row = db.prepare('SELECT * FROM dental_exams WHERE patient_id = ?').get(patientId);
  res.json(serialize(row));
});

export default router;
