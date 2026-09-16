import { CheckCircle2, CreditCard, FileSignature, UserPlus, Stethoscope, Lock, Activity } from 'lucide-react';
import type { AuditLogEntry } from '../../types';
import { formatDateTime } from '../../lib/format';
import { EmptyState } from '../common/EmptyState';

const ICONS: Record<string, typeof CheckCircle2> = {
  patient: UserPlus,
  treatment: Stethoscope,
  payment: CreditCard,
  consent: FileSignature,
  doctor: Lock,
  tooth_record: Activity,
  medical_history: Activity,
};

export function RecentActivity({ items }: { items: AuditLogEntry[] }) {
  if (items.length === 0) {
    return <EmptyState title="No activity yet" description="Actions across the clinic will show up here." />;
  }

  return (
    <ul className="divide-y divide-ink-100">
      {items.map((item) => {
        const Icon = ICONS[item.entity_type] || Activity;
        return (
          <li key={item.id} className="flex items-start gap-3 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-800">{item.description}</p>
              <p className="text-xs text-ink-400">
                {item.user_name} &middot; {formatDateTime(item.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
