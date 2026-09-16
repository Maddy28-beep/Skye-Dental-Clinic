import { useEffect, useState } from 'react';
import type { DentalExam } from '../../types';
import { dentalExamApi } from '../../api/dentalExam';
import { Button } from '../common/Button';
import { useSession } from '../../context/SessionContext';

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm has-checked:border-brand-400 has-checked:bg-brand-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-600" />
      {label}
    </label>
  );
}

// Mirrors the Periodontal Screening / Occlusion / Appliances / TMD / X-ray sections found on
// a standard intraoral examination chart - captured once per patient (like medical history)
// and editable as findings change over time, rather than versioned per visit.
export function ClinicalExamForm({ patientId }: { patientId: string }) {
  const [exam, setExam] = useState<DentalExam | null | undefined>(undefined);
  const [periodontal, setPeriodontal] = useState<Record<string, boolean | string | undefined>>({});
  const [occlusion, setOcclusion] = useState<Record<string, boolean | string | undefined>>({});
  const [appliances, setAppliances] = useState<Record<string, boolean | string | undefined>>({});
  const [tmd, setTmd] = useState<Record<string, boolean | string | undefined>>({});
  const [xray, setXray] = useState<Record<string, boolean | string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { session } = useSession();

  useEffect(() => {
    dentalExamApi.get(patientId).then((e) => {
      setExam(e);
      if (e) {
        setPeriodontal(e.periodontal);
        setOcclusion(e.occlusion);
        setAppliances(e.appliances);
        setTmd(e.tmd);
        setXray(e.xray);
      }
    });
  }, [patientId]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await dentalExamApi.save(patientId, {
        periodontal, occlusion, appliances, tmd, xray,
        recorded_by: session.name, role: session.role,
      });
      setExam(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (exam === undefined) return null;

  return (
    <div className="rounded-2xl border border-ink-100">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-800">Intraoral Examination Findings</p>
          <p className="text-xs text-ink-400">Periodontal screening, occlusion, appliances, TMD, X-ray taken</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-brand-600">{expanded ? 'Hide' : 'Edit'}</span>
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-ink-100 px-4 py-4 sm:px-5">
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Periodontal Screening</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Check checked={!!periodontal.gingivitis} onChange={(v) => setPeriodontal((p) => ({ ...p, gingivitis: v }))} label="Gingivitis" />
              <Check checked={!!periodontal.early_periodontitis} onChange={(v) => setPeriodontal((p) => ({ ...p, early_periodontitis: v }))} label="Early Periodontitis" />
              <Check checked={!!periodontal.moderate_periodontitis} onChange={(v) => setPeriodontal((p) => ({ ...p, moderate_periodontitis: v }))} label="Moderate Periodontitis" />
              <Check checked={!!periodontal.advanced_periodontitis} onChange={(v) => setPeriodontal((p) => ({ ...p, advanced_periodontitis: v }))} label="Advanced Periodontitis" />
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Occlusion</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className={FIELD_CLASS}
                placeholder="Class (Molar) — e.g. Class I"
                value={(occlusion.class_molar as string) ?? ''}
                onChange={(e) => setOcclusion((o) => ({ ...o, class_molar: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Check checked={!!occlusion.overjet} onChange={(v) => setOcclusion((o) => ({ ...o, overjet: v }))} label="Overjet" />
                <Check checked={!!occlusion.overbite} onChange={(v) => setOcclusion((o) => ({ ...o, overbite: v }))} label="Overbite" />
                <Check checked={!!occlusion.midline_deviation} onChange={(v) => setOcclusion((o) => ({ ...o, midline_deviation: v }))} label="Midline Deviation" />
                <Check checked={!!occlusion.crossbite} onChange={(v) => setOcclusion((o) => ({ ...o, crossbite: v }))} label="Crossbite" />
              </div>
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Appliances</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Check checked={!!appliances.orthodontic} onChange={(v) => setAppliances((a) => ({ ...a, orthodontic: v }))} label="Orthodontic" />
              <Check checked={!!appliances.stayplate} onChange={(v) => setAppliances((a) => ({ ...a, stayplate: v }))} label="Stayplate" />
              <input
                className={FIELD_CLASS}
                placeholder="Others"
                value={(appliances.others as string) ?? ''}
                onChange={(e) => setAppliances((a) => ({ ...a, others: e.target.value }))}
              />
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">TMD</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Check checked={!!tmd.clenching} onChange={(v) => setTmd((t) => ({ ...t, clenching: v }))} label="Clenching" />
              <Check checked={!!tmd.clicking} onChange={(v) => setTmd((t) => ({ ...t, clicking: v }))} label="Clicking" />
              <Check checked={!!tmd.trismus} onChange={(v) => setTmd((t) => ({ ...t, trismus: v }))} label="Trismus" />
              <Check checked={!!tmd.muscle_spasm} onChange={(v) => setTmd((t) => ({ ...t, muscle_spasm: v }))} label="Muscle Spasm" />
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">X-ray Taken</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Check checked={!!xray.panoramic} onChange={(v) => setXray((x) => ({ ...x, panoramic: v }))} label="Panoramic" />
              <Check checked={!!xray.cephalometric} onChange={(v) => setXray((x) => ({ ...x, cephalometric: v }))} label="Cephalometric" />
              <Check checked={!!xray.occlusal} onChange={(v) => setXray((x) => ({ ...x, occlusal: v }))} label="Occlusal (Upper/Lower)" />
              <Check checked={!!xray.cbct} onChange={(v) => setXray((x) => ({ ...x, cbct: v }))} label="CBCT" />
              <div className="flex items-center gap-2 sm:col-span-2">
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!xray.periapical} onChange={(e) => setXray((x) => ({ ...x, periapical: e.target.checked }))} className="h-4 w-4 accent-brand-600" />
                  Periapical (Tooth No.)
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder="e.g. 36, 46"
                  value={(xray.periapical_teeth as string) ?? ''}
                  onChange={(e) => setXray((x) => ({ ...x, periapical_teeth: e.target.value }))}
                />
              </div>
              <input
                className={FIELD_CLASS}
                placeholder="Others"
                value={(xray.others as string) ?? ''}
                onChange={(e) => setXray((x) => ({ ...x, others: e.target.value }))}
              />
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-ink-100 pt-3">
            {saved && <span className="text-sm text-emerald-600">Saved</span>}
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Findings'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
