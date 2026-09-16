import { useState } from 'react';
import type { PaymentMethod, Treatment } from '../../types';
import { Button } from '../common/Button';
import { formatCurrency } from '../../lib/format';

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-ink-700';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

interface PaymentFormProps {
  treatments: Treatment[];
  onSubmit: (data: { treatment_id: string | null; amount_due: number; amount_paid: number; payment_method: PaymentMethod }) => Promise<void>;
  onCancel: () => void;
}

export function PaymentForm({ treatments, onSubmit, onCancel }: PaymentFormProps) {
  const [treatmentId, setTreatmentId] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function selectTreatment(id: string) {
    setTreatmentId(id);
    const t = treatments.find((tr) => tr.id === id);
    if (t) setAmountDue(String(t.final_amount));
  }

  const balance = Math.max(0, (Number(amountDue) || 0) - (Number(amountPaid) || 0));

  async function handleSubmit() {
    if (!amountDue || Number(amountDue) <= 0) {
      setError('Enter the amount due.');
      return;
    }
    if (!amountPaid || Number(amountPaid) < 0) {
      setError('Enter the amount paid.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        treatment_id: treatmentId || null,
        amount_due: Number(amountDue),
        amount_paid: Number(amountPaid),
        payment_method: method,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL_CLASS}>Related Treatment (optional)</label>
        <select className={FIELD_CLASS} value={treatmentId} onChange={(e) => selectTreatment(e.target.value)}>
          <option value="">General payment (no specific treatment)</option>
          {treatments.map((t) => (
            <option key={t.id} value={t.id}>{t.procedure_name} &middot; {formatCurrency(t.final_amount)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>Amount Due (PHP)</label>
          <input type="number" min="0" step="0.01" className={FIELD_CLASS} value={amountDue} onChange={(e) => setAmountDue(e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Amount Paid (PHP)</label>
          <input type="number" min="0" step="0.01" className={FIELD_CLASS} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Payment Method</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={`rounded-lg border px-2 py-2.5 text-xs font-medium sm:text-sm ${
                method === m.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm">
        <div className="flex justify-between"><span className="text-ink-500">Remaining Balance</span><span className="font-semibold text-ink-900">{formatCurrency(balance)}</span></div>
      </div>

      <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        This payment will be recorded as <strong>Pending Doctor Verification</strong> until a dentist confirms it with their PIN.
      </p>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Recording...' : 'Record Payment'}</Button>
      </div>
    </div>
  );
}
