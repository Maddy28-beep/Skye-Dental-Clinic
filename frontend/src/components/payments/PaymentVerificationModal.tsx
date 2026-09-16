import { useState } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PinInput } from '../common/PinInput';
import type { Payment } from '../../types';
import { paymentsApi } from '../../api/payments';
import { ApiError } from '../../api/client';
import { formatCurrency, formatDateTime } from '../../lib/format';

interface PaymentVerificationModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment & { first_name?: string; last_name?: string; procedure_name?: string };
  onVerified: (payment: Payment) => void;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', gcash: 'GCash', bank_transfer: 'Bank Transfer', card: 'Card', other: 'Other',
};

// The PIN alone identifies the doctor - the UI never lets anyone pick a name from a list -
// so an assistant cannot attribute a verification to a doctor who didn't actually enter it.
export function PaymentVerificationModal({ open, onClose, payment, onVerified }: PaymentVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<Payment | null>(null);

  async function handleVerify() {
    if (pin.length < 4) return;
    setVerifying(true);
    setError('');
    try {
      const updated = await paymentsApi.verify(payment.id, pin);
      setResult(updated);
      onVerified(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Verification failed');
      setPin('');
    } finally {
      setVerifying(false);
    }
  }

  function handleClose() {
    setPin('');
    setError('');
    setResult(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Payment Verification" size="sm">
      {result ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShieldCheck size={28} />
          </div>
          <p className="text-lg font-semibold text-ink-900">Payment Verified</p>
          <p className="text-sm text-ink-500">Verified by: <strong className="text-ink-800">{result.verified_by_doctor_name}</strong></p>
          <p className="text-xs text-ink-400">{formatDateTime(result.verified_at)}</p>
          <Button className="mt-3" onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-1.5 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Patient</span><span className="font-medium text-ink-900">{payment.first_name} {payment.last_name}</span></div>
            {payment.procedure_name && (
              <div className="flex justify-between"><span className="text-ink-500">Procedure</span><span className="font-medium text-ink-900">{payment.procedure_name}</span></div>
            )}
            <div className="flex justify-between"><span className="text-ink-500">Amount Due</span><span className="font-medium text-ink-900">{formatCurrency(payment.amount_due)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Amount Paid</span><span className="font-semibold text-brand-700">{formatCurrency(payment.amount_paid)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Method</span><span className="font-medium text-ink-900">{METHOD_LABELS[payment.payment_method]}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Recorded by</span><span className="font-medium text-ink-900">{payment.recorded_by}</span></div>
          </div>

          <div className="text-center">
            <p className="mb-4 text-sm font-medium text-ink-700">Enter your Doctor PIN to confirm this payment is correct</p>
            <PinInput value={pin} onChange={setPin} error={!!error} disabled={verifying} />
            {error && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-rose-600">
                <ShieldAlert size={16} /> {error}
              </p>
            )}
          </div>

          <Button fullWidth size="lg" onClick={handleVerify} disabled={pin.length < 4 || verifying}>
            {verifying ? 'Verifying...' : 'Verify Payment'}
          </Button>
        </div>
      )}
    </Modal>
  );
}
