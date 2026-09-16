import type { ToothCondition } from '../../types';
import { CONDITION_META } from './toothLayout';

export function Tooth({
  number,
  condition,
  hasPlanned,
  onClick,
}: {
  number: string;
  condition: ToothCondition;
  hasPlanned?: boolean;
  onClick: () => void;
}) {
  const meta = CONDITION_META[condition];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: meta.color, color: meta.textColor }}
      className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-black/10 shadow-sm transition-transform hover:scale-105 hover:shadow-md active:scale-95 sm:h-12 sm:w-12"
      title={`Tooth ${number}: ${meta.label}`}
    >
      <span className="text-xs font-semibold sm:text-sm">{number}</span>
      {meta.code && <span className="text-[9px] font-bold leading-none opacity-80">{meta.code}</span>}
      {hasPlanned && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white" />}
    </button>
  );
}
