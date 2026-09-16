import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 disabled:bg-ink-200',
  secondary: 'bg-ink-900 text-white hover:bg-ink-800 focus-visible:outline-ink-900 disabled:bg-ink-200',
  outline: 'border border-ink-300 bg-white text-ink-700 hover:bg-ink-50 focus-visible:outline-brand-600',
  ghost: 'text-ink-600 hover:bg-ink-100 focus-visible:outline-brand-600',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 disabled:bg-ink-200',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3.5 text-base rounded-xl gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
