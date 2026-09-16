import express from 'express';
import cors from 'cors';
import './db/index.js';

import doctorsRouter from './routes/doctors.js';
import patientsRouter from './routes/patients.js';
import medicalHistoryRouter from './routes/medicalHistory.js';
import dentalExamRouter from './routes/dentalExam.js';
import toothChartRouter from './routes/toothChart.js';
import consentsRouter from './routes/consents.js';
import treatmentsRouter from './routes/treatments.js';
import paymentsRouter from './routes/payments.js';
import auditLogRouter from './routes/auditLog.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/doctors', doctorsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/medical-history', medicalHistoryRouter);
app.use('/api/dental-exam', dentalExamRouter);
app.use('/api/tooth-charts', toothChartRouter);
app.use('/api/consents', consentsRouter);
app.use('/api/treatments', treatmentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/audit-log', auditLogRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Dental backend running on http://localhost:${PORT}`);
});
