import type { ReactNode } from 'react';
import clsx from 'clsx';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-sky-100 text-sky-700',
  brand: 'bg-brand-100 text-brand-700',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium',
        TONE_CLASSES[tone]
      )}
    >
      {children}
    </span>
  );
}
