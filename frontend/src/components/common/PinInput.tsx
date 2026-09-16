import { Delete } from 'lucide-react';
import clsx from 'clsx';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

// A large on-screen numeric keypad rather than a text field: the clinic runs this on
// shared tablets, where a hardware keyboard usually isn't available and small tap targets
// are unreliable, especially mid-procedure with gloves on.
export function PinInput({ value, onChange, length = 4, error, disabled }: PinInputProps) {
  const press = (key: string) => {
    if (disabled) return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (value.length < length) {
      onChange(value + key);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'flex h-12 w-12 items-center justify-center rounded-xl border-2 text-xl font-semibold sm:h-14 sm:w-14',
              error ? 'border-rose-400 bg-rose-50' : 'border-ink-200 bg-ink-50',
              value.length === i && !disabled && 'border-brand-500'
            )}
          >
            {value[i] ? <span className="h-3 w-3 rounded-full bg-ink-800" /> : null}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {KEYS.map((key, i) =>
          key === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => press(key)}
              className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-medium text-ink-800 transition-colors hover:bg-ink-100 active:bg-ink-200 disabled:opacity-50 sm:h-16 sm:w-16"
            >
              {key === 'del' ? <Delete size={22} /> : key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
