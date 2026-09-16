import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { RoleSwitcher } from './RoleSwitcher';
import { QuickSearch } from './QuickSearch';
import { PendingVerificationBadge } from './PendingVerificationBadge';

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* Tablet: icon-only rail. Desktop: full labeled sidebar. Only one is ever displayed. */}
      <aside className="hidden w-20 shrink-0 border-r border-ink-100 md:flex lg:hidden">
        <Sidebar collapsedLabels />
      </aside>
      <aside className="hidden w-64 shrink-0 border-r border-ink-100 lg:flex">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-72 max-w-[80vw] flex-col bg-white shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ink-100 bg-white px-3 sm:px-6">
          <button
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="hidden flex-1 sm:block">
            <QuickSearch />
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <PendingVerificationBadge />
            <RoleSwitcher />
          </div>
        </header>
        <div className="border-b border-ink-100 bg-white px-3 py-2 sm:hidden">
          <QuickSearch />
        </div>
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-screen-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
