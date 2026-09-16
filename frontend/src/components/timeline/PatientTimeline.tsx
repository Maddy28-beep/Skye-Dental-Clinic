import { useEffect, useState } from 'react';
import { CheckCircle2, UserPlus, Stethoscope, CreditCard, ShieldCheck, FileSignature, Activity } from 'lucide-react';
import { patientsApi } from '../../api/patients';
import type { TimelineEvent } from '../../types';
import { formatDateTime } from '../../lib/format';
import { EmptyState } from '../common/EmptyState';

const ICONS: Record<string, typeof CheckCircle2> = {
  patient_registered: UserPlus,
  treatment: Stethoscope,
  payment_recorded: CreditCard,
  payment_verified: ShieldCheck,
  consent_created: FileSignature,
  consent_signed: FileSignature,
  tooth_update: Activity,
};

export function PatientTimeline({ patientId }: { patientId: string }) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);

  useEffect(() => {
    patientsApi.timeline(patientId).then(setEvents);
  }, [patientId]);

  if (!events) return null;
  if (events.length === 0) {
    return <EmptyState title="No history yet" description="Patient activity will appear here as it happens." />;
  }

  return (
    <ol className="relative space-y-6 border-l-2 border-ink-100 pl-6">
      {events.map((e, i) => {
        const Icon = ICONS[e.type] || Activity;
        const verified = e.type === 'payment_verified' || e.type === 'consent_signed';
        return (
          <li key={`${e.ref_id}-${i}`} className="relative">
            <span
              className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                verified ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-100 text-brand-600'
              }`}
            >
              <Icon size={13} />
            </span>
            <p className="text-xs text-ink-400">{formatDateTime(e.at)}</p>
            <p className="text-sm font-medium text-ink-900">{e.title}</p>
            {e.detail && <p className="text-sm text-ink-500">{e.detail}</p>}
          </li>
        );
      })}
    </ol>
  );
}
