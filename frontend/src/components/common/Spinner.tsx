import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 size={size} className={clsx('animate-spin text-brand-600', className)} />;
}

export function FullPageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-ink-500">
      <Spinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
