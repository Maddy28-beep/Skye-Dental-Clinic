import { useEffect, useMemo, useState } from 'react';
import { toothChartApi } from '../../api/toothChart';
import { doctorsApi } from '../../api/doctors';
import type { Doctor, ToothRecord } from '../../types';
import { Tooth } from './Tooth';
import { ToothDetailModal } from './ToothDetailModal';
import { CONDITION_META, CONDITION_GROUPS, ADULT_UPPER, ADULT_LOWER, PEDIATRIC_UPPER, PEDIATRIC_LOWER } from './toothLayout';
import { Spinner } from '../common/Spinner';
import { useSession } from '../../context/SessionContext';

export function ToothChart({ patientId }: { patientId: string }) {
  const [mode, setMode] = useState<'adult' | 'pediatric'>('adult');
  const [current, setCurrent] = useState<ToothRecord[] | null>(null);
  const [history, setHistory] = useState<ToothRecord[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const { session } = useSession();

  function loadCurrent() {
    toothChartApi.current(patientId).then(setCurrent);
  }

  useEffect(() => {
    loadCurrent();
    toothChartApi.history(patientId).then(setHistory);
    doctorsApi.list().then(setDoctors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const byTooth = useMemo(() => {
    const map = new Map<string, ToothRecord>();
    (current ?? []).forEach((r) => map.set(r.tooth_number, r));
    return map;
  }, [current]);

  const upperRow = mode === 'adult' ? ADULT_UPPER : PEDIATRIC_UPPER;
  const lowerRow = mode === 'adult' ? ADULT_LOWER : PEDIATRIC_LOWER;

  const selectedRecord = selectedTooth ? byTooth.get(selectedTooth) ?? null : null;
  const selectedHistory = selectedTooth ? history.filter((h) => h.tooth_number === selectedTooth) : [];

  if (!current) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-xl bg-ink-100 p-1">
          <button
            onClick={() => setMode('adult')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === 'adult' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
          >
            Adult (Permanent)
          </button>
          <button
            onClick={() => setMode('pediatric')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === 'pediatric' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
          >
            Pediatric (Primary)
          </button>
        </div>
        <p className="text-xs text-ink-400">Tap a tooth to view or update its record.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-ink-50 p-4 sm:p-6">
        <div className="mx-auto flex min-w-max flex-col items-center gap-3">
          <div className="flex gap-1.5 sm:gap-2">
            {upperRow.map((n) => (
              <Tooth
                key={n}
                number={n}
                condition={byTooth.get(n)?.condition ?? 'healthy'}
                hasPlanned={!!byTooth.get(n)?.planned_treatment}
                onClick={() => setSelectedTooth(n)}
              />
            ))}
          </div>
          <div className="h-px w-full bg-ink-200" />
          <div className="flex gap-1.5 sm:gap-2">
            {lowerRow.map((n) => (
              <Tooth
                key={n}
                number={n}
                condition={byTooth.get(n)?.condition ?? 'healthy'}
                hasPlanned={!!byTooth.get(n)?.planned_treatment}
                onClick={() => setSelectedTooth(n)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-ink-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Legend</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CONDITION_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 text-xs font-medium text-ink-500">{group.title}</p>
              <div className="space-y-1">
                {group.options.map((c) => {
                  const meta = CONDITION_META[c];
                  return (
                    <div key={c} className="flex items-center gap-1.5 text-xs text-ink-600">
                      <span className="h-3 w-3 shrink-0 rounded border border-black/10" style={{ backgroundColor: meta.color }} />
                      {meta.code && <span className="w-6 shrink-0 font-mono font-bold text-ink-500">{meta.code}</span>}
                      <span className="truncate">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 border-t border-ink-100 pt-2 text-xs text-ink-600">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Has planned treatment
        </div>
      </div>

      {selectedTooth && (
        <ToothDetailModal
          open={!!selectedTooth}
          onClose={() => setSelectedTooth(null)}
          toothNumber={selectedTooth}
          current={selectedRecord}
          history={selectedHistory}
          doctors={doctors}
          onSave={async (data) => {
            await toothChartApi.record(patientId, {
              ...data,
              dentist_id: data.dentist_id || null,
              recorded_by: session.name,
              role: session.role,
            });
            loadCurrent();
            toothChartApi.history(patientId).then(setHistory);
            setSelectedTooth(null);
          }}
        />
      )}
    </div>
  );
}
