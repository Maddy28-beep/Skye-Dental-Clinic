import { useEffect, useState } from 'react';
import { treatmentsApi } from '../api/treatments';
import type { Treatment, TreatmentStatus } from '../types';
import { Card } from '../components/common/Card';
import { FullPageSpinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { TreatmentTable } from '../components/treatments/TreatmentTable';
import { Stethoscope } from 'lucide-react';

const STATUS_FILTERS: { value: TreatmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[] | null>(null);
  const [status, setStatus] = useState<TreatmentStatus | 'all'>('all');

  useEffect(() => {
    treatmentsApi.list(status === 'all' ? undefined : { status }).then(setTreatments);
  }, [status]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">Treatments & Procedures</h1>
        <p className="text-sm text-ink-500">All treatment records across the clinic.</p>
      </div>

      <Card>
        <div className="flex gap-2 overflow-x-auto border-b border-ink-100 p-4">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                status === s.value ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {!treatments ? (
          <FullPageSpinner />
        ) : treatments.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Stethoscope size={32} />} title="No treatments found" description="Treatments recorded for patients will show up here." />
          </div>
        ) : (
          <TreatmentTable treatments={treatments} showPatient />
        )}
      </Card>
    </div>
  );
}
