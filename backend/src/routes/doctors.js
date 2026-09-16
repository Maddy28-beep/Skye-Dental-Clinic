import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, hashPin, verifyDoctorPin } from '../db/index.js';

const router = Router();

function publicDoctor(row) {
  if (!row) return null;
  const { pin_hash, pin_salt, failed_attempts, locked_until, ...rest } = row;
  return rest;
}

// List doctors (no PIN data exposed)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM doctors ORDER BY name').all();
  res.json(rows.map(publicDoctor));
});

// Add a new doctor
router.post('/', (req, res) => {
  const { name, specialty, pin } = req.body;
  if (!name || !pin) return res.status(400).json({ error: 'name and pin are required' });
  if (!/^\d{4,6}$/.test(String(pin))) {
    return res.status(400).json({ error: 'PIN must be 4-6 digits' });
  }
  const id = nanoid();
  const { hash, salt } = hashPin(pin);
  db.prepare(
    'INSERT INTO doctors (id, name, specialty, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, specialty || null, hash, salt);
  res.status(201).json(publicDoctor(db.prepare('SELECT * FROM doctors WHERE id = ?').get(id)));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Doctor not found' });
  const { name, specialty, active, pin } = req.body;
  let pinHash = existing.pin_hash;
  let pinSalt = existing.pin_salt;
  if (pin) {
    if (!/^\d{4,6}$/.test(String(pin))) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }
    const hashed = hashPin(pin);
    pinHash = hashed.hash;
    pinSalt = hashed.salt;
  }
  db.prepare(
    'UPDATE doctors SET name = ?, specialty = ?, active = ?, pin_hash = ?, pin_salt = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    specialty ?? existing.specialty,
    active === undefined ? existing.active : active ? 1 : 0,
    pinHash,
    pinSalt,
    req.params.id
  );
  res.json(publicDoctor(db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM doctors WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Verify a PIN and return which doctor it belongs to, without needing a doctor id up front.
// The PIN is looked up against every active doctor's hash - the caller never names a doctor,
// which is what prevents an assistant from picking who gets credited.
router.post('/verify-pin', (req, res) => {
  const { doctor, error } = verifyDoctorPin(req.body.pin);
  if (error) return res.status(error.status).json({ error: error.message });
  res.json(publicDoctor(doctor));
});

export default router;
