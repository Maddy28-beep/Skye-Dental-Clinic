import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsListPage } from './pages/PatientsListPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { TreatmentsPage } from './pages/TreatmentsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { AuditLogPage } from './pages/AuditLogPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/:id" element={<PatientProfilePage />} />
        <Route path="/treatments" element={<TreatmentsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
      </Routes>
    </AppShell>
  );
}
