import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { paymentsApi } from '../../api/payments';

export function PendingVerificationBadge() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    function load() {
      paymentsApi.pending().then((rows) => {
        if (!cancelled) setCount(rows.length);
      }).catch(() => {});
    }
    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <button
      onClick={() => navigate('/payments?filter=pending')}
      className="relative rounded-xl border border-ink-200 bg-white p-2.5 text-ink-600 hover:bg-ink-50"
      aria-label="Payments pending doctor verification"
      title="Payments pending doctor verification"
    >
      <BellRing size={18} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
