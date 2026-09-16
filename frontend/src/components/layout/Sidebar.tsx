import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Stethoscope } from 'lucide-react';
import { NAV_ITEMS } from './navConfig';

export function Sidebar({
  collapsedLabels = false,
  onNavigate,
}: {
  collapsedLabels?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      {collapsedLabels ? (
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-ink-100 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Stethoscope size={18} />
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-b border-ink-100">
          {/* Square source image (1254x1254) - object-contain keeps it uncropped; height
              is capped so the logo doesn't dominate the sidebar. */}
          <img
            src="/skye%20logo.png"
            alt="Skye Dental Clinic"
            className="h-24 w-full object-contain py-2"
          />
          <p className="px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-ink-400">Clinic Monitoring System</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsedLabels ? item.label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                collapsedLabels && 'justify-center px-0',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              )
            }
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsedLabels && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
