import type { ToothCondition } from '../../types';
import { CONDITION_META } from './toothLayout';

export function Tooth({
  number,
  conditions,
  hasPlanned,
  onClick,
}: {
  number: string;
  conditions: ToothCondition[];
  hasPlanned?: boolean;
  onClick: () => void;
}) {
  // Background reflects the primary (first-selected) code; when more than one code
  // applies, the small badge lists all of them so nothing selected is hidden.
  const primary = CONDITION_META[conditions[0] ?? 'healthy'];
  const codes = conditions.map((c) => CONDITION_META[c].code).filter(Boolean).join('·');
  const title = conditions.map((c) => CONDITION_META[c].label).join(', ');
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: primary.color, color: primary.textColor }}
      className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-black/10 shadow-sm transition-transform hover:scale-105 hover:shadow-md active:scale-95 sm:h-12 sm:w-12"
      title={`Tooth ${number}: ${title}`}
    >
      <span className="text-xs font-semibold sm:text-sm">{number}</span>
      {codes && <span className="text-[9px] font-bold leading-none opacity-80">{codes}</span>}
      {hasPlanned && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white" />}
    </button>
  );
}
