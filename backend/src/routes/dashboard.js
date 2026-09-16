import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/summary', (req, res) => {
  const totalPatients = db.prepare('SELECT COUNT(*) as c FROM patients').get().c;
  const todayTreatments = db.prepare("SELECT COUNT(*) as c FROM treatments WHERE visit_date = date('now')").get().c;
  const completedTreatments = db.prepare("SELECT COUNT(*) as c FROM treatments WHERE status = 'completed'").get().c;
  const pendingVerification = db.prepare("SELECT COUNT(*) as c FROM payments WHERE status = 'pending'").get().c;
  const pendingBalance = db.prepare("SELECT COALESCE(SUM(balance), 0) as s FROM payments WHERE status = 'pending'").get().s;
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(amount_paid), 0) as s FROM payments WHERE payment_date = date('now') AND status = 'verified'").get().s;

  const recentPatients = db.prepare('SELECT * FROM patients ORDER BY created_at DESC LIMIT 5').all();

  const recentActivity = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10').all();

  res.json({
    totalPatients,
    todayTreatments,
    completedTreatments,
    pendingVerification,
    pendingBalance,
    todayRevenue,
    recentPatients,
    recentActivity,
  });
});

export default router;
