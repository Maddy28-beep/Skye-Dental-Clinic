import type { Treatment, TreatmentStatus } from '../../types';
import { Badge, type BadgeTone } from '../common/Badge';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../lib/format';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const STATUS_TONE: Record<TreatmentStatus, BadgeTone> = {
  planned: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const STATUS_LABELS: Record<TreatmentStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_OPTIONS: TreatmentStatus[] = ['planned', 'in_progress', 'completed', 'cancelled'];

function StatusControl({
  status,
  onChange,
}: {
  status: TreatmentStatus;
  onChange?: (status: TreatmentStatus) => void;
}) {
  if (!onChange) return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
  return (
    <select
      value={status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as TreatmentStatus)}
      className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-medium text-ink-700 outline-none focus:border-brand-500"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

export function TreatmentTable({
  treatments,
  showPatient,
  onSelect,
  onStatusChange,
  onRecordPayment,
}: {
  treatments: Treatment[];
  showPatient?: boolean;
  onSelect?: (t: Treatment) => void;
  onStatusChange?: (t: Treatment, status: TreatmentStatus) => void;
  onRecordPayment?: (t: Treatment) => void;
}) {
  const navigate = useNavigate();

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
              {showPatient && <th className="px-4 py-3 font-medium">Patient</th>}
              <th className="px-4 py-3 font-medium">Procedure</th>
              <th className="px-4 py-3 font-medium">Tooth</th>
              <th className="px-4 py-3 font-medium">Visit Date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next Appt.</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {treatments.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer hover:bg-ink-50"
                onClick={() => (onSelect ? onSelect(t) : showPatient && navigate(`/patients/${t.patient_id}`))}
              >
                {showPatient && (
                  <td className="px-4 py-3 font-medium text-ink-900">{t.first_name} {t.last_name}</td>
                )}
                <td className="px-4 py-3 text-ink-900">{t.procedure_name}</td>
                <td className="px-4 py-3 text-ink-500">{t.tooth_numbers.length ? t.tooth_numbers.join(', ') : '—'}</td>
                <td className="px-4 py-3 text-ink-500">{formatDate(t.visit_date)}</td>
                <td className="px-4 py-3 font-medium text-ink-900">{formatCurrency(t.final_amount)}</td>
                <td className="px-4 py-3">
                  <StatusControl status={t.status} onChange={onStatusChange ? (s) => onStatusChange(t, s) : undefined} />
                </td>
                <td className="px-4 py-3 text-ink-500">{t.next_appointment_date ? formatDate(t.next_appointment_date) : '—'}</td>
                <td className="px-4 py-3">
                  {onRecordPayment && (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onRecordPayment(t); }}>
                      <Wallet size={14} /> Pay
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-ink-100 sm:hidden">
        {treatments.map((t) => (
          <li
            key={t.id}
            className="flex flex-col gap-1 px-4 py-3.5"
            onClick={() => (onSelect ? onSelect(t) : showPatient && navigate(`/patients/${t.patient_id}`))}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-ink-900">{t.procedure_name}</span>
              <StatusControl status={t.status} onChange={onStatusChange ? (s) => onStatusChange(t, s) : undefined} />
            </div>
            {showPatient && <span className="text-xs text-ink-500">{t.first_name} {t.last_name}</span>}
            <span className="text-xs text-ink-400">
              {formatDate(t.visit_date)} {t.tooth_numbers.length ? `· Tooth ${t.tooth_numbers.join(', ')}` : ''}
            </span>
            <span className="text-sm font-semibold text-ink-900">{formatCurrency(t.final_amount)}</span>
            {t.next_appointment_date && <span className="text-xs text-brand-600">Next appt: {formatDate(t.next_appointment_date)}</span>}
            {onRecordPayment && (
              <Button size="sm" variant="outline" className="mt-1.5 self-start" onClick={(e) => { e.stopPropagation(); onRecordPayment(t); }}>
                <Wallet size={14} /> Record Payment
              </Button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
