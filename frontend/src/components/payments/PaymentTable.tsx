import { ShieldCheck } from 'lucide-react';
import type { Payment } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../lib/format';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', gcash: 'GCash', bank_transfer: 'Bank Transfer', card: 'Card', other: 'Other',
};

export function PaymentTable({
  payments,
  showPatient,
  onVerify,
}: {
  payments: Payment[];
  showPatient?: boolean;
  onVerify?: (payment: Payment) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
              {showPatient && <th className="px-4 py-3 font-medium">Patient</th>}
              <th className="px-4 py-3 font-medium">Procedure</th>
              <th className="px-4 py-3 font-medium">Due / Paid</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Recorded By</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-ink-50">
                {showPatient && <td className="px-4 py-3 font-medium text-ink-900">{p.first_name} {p.last_name}</td>}
                <td className="px-4 py-3 text-ink-600">{p.procedure_name || 'General payment'}</td>
                <td className="px-4 py-3 text-ink-900">
                  {formatCurrency(p.amount_paid)} <span className="text-ink-400">/ {formatCurrency(p.amount_due)}</span>
                </td>
                <td className="px-4 py-3 text-ink-500">{METHOD_LABELS[p.payment_method]}</td>
                <td className="px-4 py-3 text-ink-500">{p.recorded_by}</td>
                <td className="px-4 py-3">
                  {p.status === 'verified' ? (
                    <Badge tone="success">Verified · {p.verified_by_doctor_name}</Badge>
                  ) : (
                    <Badge tone="warning">Pending Verification</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-500">{formatDate(p.payment_date)}</td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && onVerify && (
                    <Button size="sm" variant="outline" onClick={() => onVerify(p)}>
                      <ShieldCheck size={15} /> Verify
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-ink-100 sm:hidden">
        {payments.map((p) => (
          <li key={p.id} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                {showPatient && <p className="text-xs text-ink-500">{p.first_name} {p.last_name}</p>}
                <p className="font-medium text-ink-900">{p.procedure_name || 'General payment'}</p>
                <p className="text-xs text-ink-400">{formatDate(p.payment_date)} · {METHOD_LABELS[p.payment_method]}</p>
              </div>
              {p.status === 'verified' ? (
                <Badge tone="success">Verified</Badge>
              ) : (
                <Badge tone="warning">Pending</Badge>
              )}
            </div>
            <p className="mt-1.5 text-sm font-semibold text-ink-900">
              {formatCurrency(p.amount_paid)} <span className="font-normal text-ink-400">/ {formatCurrency(p.amount_due)}</span>
            </p>
            {p.status === 'pending' && onVerify && (
              <Button size="sm" variant="outline" className="mt-2" onClick={() => onVerify(p)}>
                <ShieldCheck size={15} /> Verify Payment
              </Button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
