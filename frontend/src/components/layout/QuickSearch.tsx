import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { patientsApi } from '../../api/patients';
import type { Patient } from '../../types';

export function QuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      patientsApi.list(query).then((r) => setResults(r.slice(0, 6)));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="relative w-full max-w-sm" ref={ref}>
      <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:bg-white">
        <Search size={18} className="shrink-0 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search patients by name, ID, or contact..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-ink-400 hover:text-ink-600">
            <X size={16} />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-400">No matching patients.</p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  navigate(`/patients/${p.id}`);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-ink-50"
              >
                <span className="font-medium text-ink-900">
                  {p.first_name} {p.last_name}
                </span>
                <span className="text-xs text-ink-400">{p.patient_code}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
