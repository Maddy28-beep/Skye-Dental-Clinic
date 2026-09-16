import { useState, useRef, useEffect } from 'react';
import { ChevronDown, UserCircle2, LogOut } from 'lucide-react';
import { useSession, ROLE_LABELS } from '../../context/SessionContext';

// Shows the real signed-in Firebase Auth user (name/role come from their `staff` doc) and
// lets them sign out. There's no more "switch between demo users" - identity now comes
// from an actual login, which is what makes the audit trail and PIN verification trustworthy.
export function RoleSwitcher() {
  const { session, signOutUser } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm hover:bg-ink-50"
      >
        <UserCircle2 size={20} className="text-brand-600" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block font-medium text-ink-900">{session.name}</span>
          <span className="block text-xs text-ink-400">{ROLE_LABELS[session.role]}</span>
        </span>
        <ChevronDown size={16} className="text-ink-400" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
          <div className="px-3 py-2.5">
            <p className="font-medium text-ink-900">{session.name}</p>
            <p className="text-xs text-ink-400">{session.email}</p>
            <p className="mt-0.5 text-xs text-ink-400">{ROLE_LABELS[session.role]}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              signOutUser();
            }}
            className="flex w-full items-center gap-2 border-t border-ink-100 px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
