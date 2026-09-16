/**
 * Brand mark: a single cohesive symbol (not a literal collage of tooth + cross + smile).
 * The tooth silhouette's gum-line is drawn as a gentle upward arc — doing double duty as
 * the "smile curve" — and a single precision dot sits at its midpoint, reading as a
 * monitoring/scan point without adding a second competing shape.
 */
export function IconMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Skye Dental Clinic"
    >
      <rect width="40" height="40" rx="10" fill="currentColor" className="text-brand-600" />
      <path
        d="M20 9.5
           C 21.7 7.9 23.4 7.2 25.3 7.2
           C 28.9 7.2 31.3 10 31.1 13.6
           C 30.95 16.4 30.05 18.8 29.05 21.6
           C 28.15 24.15 27.3 26.85 26.55 28.9
           C 26.05 30.3 25.35 31.6 24.05 31.6
           C 22.55 31.6 22.35 28.55 21.15 26.55
           C 20.75 25.9 20.4 25.6 20 25.6
           C 19.6 25.6 19.25 25.9 18.85 26.55
           C 17.65 28.55 17.45 31.6 15.95 31.6
           C 14.65 31.6 13.95 30.3 13.45 28.9
           C 12.7 26.85 11.85 24.15 10.95 21.6
           C 9.95 18.8 9.05 16.4 8.9 13.6
           C 8.7 10 11.1 7.2 14.7 7.2
           C 16.6 7.2 18.3 7.9 20 9.5 Z"
        fill="white"
      />
      <path
        d="M14.5 20 C 16.5 22.4 23.5 22.4 25.5 20"
        stroke="currentColor"
        className="text-brand-600"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="20" cy="22.3" r="1.15" fill="currentColor" className="text-brand-600" opacity="0.85" />
    </svg>
  );
}

export function LogoLockup({
  size = 36,
  tagline = true,
  className,
}: {
  size?: number;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <IconMark size={size} />
      <div className="leading-tight">
        <p className="font-semibold text-ink-900" style={{ fontSize: size * 0.42 }}>
          Skye Dental Clinic
        </p>
        {tagline && (
          <p className="text-ink-400" style={{ fontSize: size * 0.28 }}>
            Clinic Monitoring System
          </p>
        )}
      </div>
    </div>
  );
}
