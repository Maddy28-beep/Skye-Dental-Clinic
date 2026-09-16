import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { paymentsApi } from '../api/payments';
import type { Payment } from '../types';
import { Card } from '../components/common/Card';
import { FullPageSpinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { PaymentTable } from '../components/payments/PaymentTable';
import { PaymentVerificationModal } from '../components/payments/PaymentVerificationModal';

const FILTERS = [
  { value: 'all', label: 'All Payments' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'verified', label: 'Verified' },
] as const;

export function PaymentsPage() {
  const [params, setParams] = useSearchParams();
  const filter = (params.get('filter') as 'all' | 'pending' | 'verified') || 'all';
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [verifying, setVerifying] = useState<Payment | null>(null);

  function load() {
    paymentsApi.list(filter === 'all' ? undefined : filter).then(setPayments);
  }

  useEffect(load, [filter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">Payments</h1>
        <p className="text-sm text-ink-500">Track payments and doctor PIN verification.</p>
      </div>

      <Card>
        <div className="flex gap-2 overflow-x-auto border-b border-ink-100 p-4">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setParams(f.value === 'all' ? {} : { filter: f.value })}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                filter === f.value ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!payments ? (
          <FullPageSpinner />
        ) : payments.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Wallet size={32} />} title="No payments found" description="Payments recorded for patients will show up here." />
          </div>
        ) : (
          <PaymentTable payments={payments} showPatient onVerify={setVerifying} />
        )}
      </Card>

      {verifying && (
        <PaymentVerificationModal
          open={!!verifying}
          onClose={() => setVerifying(null)}
          payment={verifying}
          onVerified={() => load()}
        />
      )}
    </div>
  );
}
