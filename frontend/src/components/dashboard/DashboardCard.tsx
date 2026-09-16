import type { ComponentType } from 'react';
import clsx from 'clsx';
import { Card } from '../common/Card';

interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone?: 'brand' | 'warning' | 'success' | 'neutral';
  hint?: string;
}

const TONE_CLASSES: Record<NonNullable<DashboardCardProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  warning: 'bg-amber-50 text-amber-600',
  success: 'bg-emerald-50 text-emerald-600',
  neutral: 'bg-ink-100 text-ink-600',
};

export function DashboardCard({ label, value, icon: Icon, tone = 'brand', hint }: DashboardCardProps) {
  return (
    <Card className="flex items-center gap-4 p-4 sm:p-5">
      <div className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', TONE_CLASSES[tone])}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-500">{label}</p>
        <p className="text-xl font-semibold text-ink-900 sm:text-2xl">{value}</p>
        {hint && <p className="truncate text-xs text-ink-400">{hint}</p>}
      </div>
    </Card>
  );
}
