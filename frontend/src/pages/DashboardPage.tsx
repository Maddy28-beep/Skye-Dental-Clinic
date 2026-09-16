import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Stethoscope, Wallet, ShieldCheck, CalendarCheck2, TrendingUp } from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import type { DashboardSummary } from '../types';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { FullPageSpinner } from '../components/common/Spinner';
import { formatCurrency, initials } from '../lib/format';
import { useSession } from '../context/SessionContext';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    dashboardApi.summary().then(setSummary);
  }, []);

  if (!summary) return <FullPageSpinner label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">Good day, {session.name.split(' ')[0]}</h1>
        <p className="text-sm text-ink-500">Here's what's happening at the clinic today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardCard label="Total Patients" value={summary.totalPatients} icon={Users} tone="brand" />
        <DashboardCard label="Today's Treatments" value={summary.todayTreatments} icon={Stethoscope} tone="success" />
        <DashboardCard label="Completed Treatments" value={summary.completedTreatments} icon={CalendarCheck2} tone="neutral" />
        <DashboardCard
          label="Pending Doctor Verification"
          value={summary.pendingVerification}
          icon={ShieldCheck}
          tone="warning"
          hint={summary.pendingVerification > 0 ? 'Needs a doctor PIN' : undefined}
        />
        <DashboardCard label="Pending Balance" value={formatCurrency(summary.pendingBalance)} icon={Wallet} tone="warning" />
        <DashboardCard label="Today's Verified Revenue" value={formatCurrency(summary.todayRevenue)} icon={TrendingUp} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="Recent Patients"
            action={
              <button onClick={() => navigate('/patients')} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </button>
            }
          />
          <CardBody className="p-0">
            {summary.recentPatients.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-ink-400">No patients registered yet.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {summary.recentPatients.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => navigate(`/patients/${p.id}`)}
                      className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-ink-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                        {initials(p.first_name, p.last_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-ink-400">{p.patient_code}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Recent Activity" subtitle="Latest actions across the clinic" />
          <CardBody>
            <RecentActivity items={summary.recentActivity} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
