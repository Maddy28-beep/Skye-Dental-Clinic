import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { Doctor, ToothCondition, ToothRecord } from '../../types';
import { CONDITION_META, CONDITION_GROUPS } from './toothLayout';
import { formatDateTime } from '../../lib/format';
import { useSession } from '../../context/SessionContext';

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-ink-700';

interface ToothDetailModalProps {
  open: boolean;
  onClose: () => void;
  toothNumber: string;
  current: ToothRecord | null;
  history: ToothRecord[];
  doctors: Doctor[];
  onSave: (data: {
    tooth_number: string;
    conditions: ToothCondition[];
    existing_treatment: string;
    planned_treatment: string;
    notes: string;
    dentist_id: string;
  }) => Promise<void>;
}

export function ToothDetailModal({ open, onClose, toothNumber, current, history, doctors, onSave }: ToothDetailModalProps) {
  const { session } = useSession();
  const [conditions, setConditions] = useState<ToothCondition[]>(current?.conditions ?? ['healthy']);
  const [existingTreatment, setExistingTreatment] = useState(current?.existing_treatment ?? '');
  const [plannedTreatment, setPlannedTreatment] = useState(current?.planned_treatment ?? '');
  const [notes, setNotes] = useState(current?.notes ?? '');
  const [dentistId, setDentistId] = useState(current?.dentist_id ?? '');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  function toggleCondition(c: ToothCondition) {
    setConditions((prev) => {
      if (c === 'healthy') return ['healthy'];
      const withoutHealthy = prev.filter((p) => p !== 'healthy');
      const next = withoutHealthy.includes(c) ? withoutHealthy.filter((p) => p !== c) : [...withoutHealthy, c];
      return next.length === 0 ? ['healthy'] : next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        tooth_number: toothNumber,
        conditions,
        existing_treatment: existingTreatment,
        planned_treatment: plannedTreatment,
        notes,
        dentist_id: dentistId,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Tooth #${toothNumber}`}
      subtitle={session.role === 'dentist' ? undefined : 'Dentists confirm the clinical condition and plan'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Tooth Record'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <label className={LABEL_CLASS}>Condition</label>
          <p className="-mt-1 text-xs text-ink-400">Select one or more - e.g. a Condition code and a Restoration code can both apply to the same tooth.</p>
          {CONDITION_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{group.title}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.options.map((c) => {
                  const selected = conditions.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCondition(c)}
                      style={selected ? { backgroundColor: CONDITION_META[c].color, color: CONDITION_META[c].textColor } : undefined}
                      className={`flex items-center gap-1.5 rounded-lg border px-2 py-2.5 text-left text-xs font-medium sm:text-sm ${
                        selected ? 'border-transparent ring-2 ring-brand-400' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                      }`}
                    >
                      {CONDITION_META[c].code && (
                        <span className="shrink-0 rounded bg-black/10 px-1 text-[10px] font-bold">{CONDITION_META[c].code}</span>
                      )}
                      <span className="truncate">{CONDITION_META[c].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className={LABEL_CLASS}>Existing Treatment</label>
          <input className={FIELD_CLASS} value={existingTreatment} onChange={(e) => setExistingTreatment(e.target.value)} placeholder="e.g. Amalgam filling (2023)" />
        </div>
        <div>
          <label className={LABEL_CLASS}>Planned Treatment</label>
          <input className={FIELD_CLASS} value={plannedTreatment} onChange={(e) => setPlannedTreatment(e.target.value)} placeholder="e.g. Root canal next visit" />
        </div>
        <div>
          <label className={LABEL_CLASS}>Notes</label>
          <textarea className={FIELD_CLASS} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Dentist</label>
          <select className={FIELD_CLASS} value={dentistId} onChange={(e) => setDentistId(e.target.value)}>
            <option value="">Unassigned</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {history.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowHistory((s) => !s)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {showHistory ? 'Hide' : 'Show'} history ({history.length})
            </button>
            {showHistory && (
              <ul className="mt-2 space-y-2 rounded-xl border border-ink-100 p-3">
                {history.map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {h.conditions.map((c) => (
                          <Badge key={c} tone="neutral">{CONDITION_META[c].label}</Badge>
                        ))}
                      </div>
                      {h.notes && <p className="mt-1 text-ink-500">{h.notes}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-ink-400">{formatDateTime(h.recorded_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
