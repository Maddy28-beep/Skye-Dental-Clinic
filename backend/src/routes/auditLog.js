import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const { patientId, entityType, limit = 200 } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  if (patientId) { sql += ' AND patient_id = ?'; params.push(patientId); }
  if (entityType) { sql += ' AND entity_type = ?'; params.push(entityType); }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit));
  res.json(db.prepare(sql).all(...params));
});

export default router;
