import { useState } from 'react';
import type { ConsentTemplate, Treatment } from '../../types';
import { Button } from '../common/Button';
import {
  buildGeneralConsentSections, GENERAL_CONSENT_CLOSING,
  ORAL_SURGERY_INTRO, ORAL_SURGERY_RISKS, ORAL_SURGERY_CLOSING,
} from '../../lib/consentTemplates';

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-ink-700';

const TEMPLATES: { value: ConsentTemplate; label: string; description: string }[] = [
  { value: 'general', label: 'General Informed Consent', description: 'Covers routine treatment — patient initials each section (fillings, extraction, crowns, root canal, etc).' },
  { value: 'oral_surgery', label: 'Oral Surgery Consent', description: 'For extractions/surgical procedures — lists surgical risks and anesthesia type, plus witness signature.' },
];

function buildOralSurgeryText(procedure: string) {
  const risks = ORAL_SURGERY_RISKS.map((r, i) => `${i + 1}. ${r}`).join('\n');
  return `${ORAL_SURGERY_INTRO(procedure)}\n\n${risks}\n\n${ORAL_SURGERY_CLOSING}`;
}

export function NewConsentForm({
  treatments,
  onSubmit,
  onCancel,
}: {
  treatments: Treatment[];
  onSubmit: (data: { procedure_name: string; consent_text: string; template: ConsentTemplate; sections?: ReturnType<typeof buildGeneralConsentSections>; treatment_id: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [template, setTemplate] = useState<ConsentTemplate>('general');
  const [treatmentId, setTreatmentId] = useState(treatments[0]?.id ?? '');
  const [procedureName, setProcedureName] = useState(treatments[0]?.procedure_name ?? '');
  const [customProcedure, setCustomProcedure] = useState('');
  const [saving, setSaving] = useState(false);

  function selectTreatment(id: string) {
    setTreatmentId(id);
    const t = treatments.find((tr) => tr.id === id);
    if (t) setProcedureName(t.procedure_name);
  }

  const effectiveProcedure = treatmentId ? procedureName : customProcedure.trim();
  const previewText = template === 'general'
    ? `${buildGeneralConsentSections(effectiveProcedure || 'dental procedure').map((s) => `${s.label.toUpperCase()}: ${s.text}`).join('\n\n')}\n\n${GENERAL_CONSENT_CLOSING}`
    : buildOralSurgeryText(effectiveProcedure || 'dental procedure');

  async function handleSubmit() {
    if (!effectiveProcedure) return;
    setSaving(true);
    try {
      if (template === 'general') {
        const sections = buildGeneralConsentSections(effectiveProcedure);
        await onSubmit({
          procedure_name: effectiveProcedure,
          consent_text: `${sections.map((s) => `${s.label.toUpperCase()}: ${s.text}`).join('\n\n')}\n\n${GENERAL_CONSENT_CLOSING}`,
          template,
          sections,
          treatment_id: treatmentId || null,
        });
      } else {
        await onSubmit({
          procedure_name: effectiveProcedure,
          consent_text: buildOralSurgeryText(effectiveProcedure),
          template,
          treatment_id: treatmentId || null,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL_CLASS}>Consent Type</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTemplate(t.value)}
              className={`rounded-xl border p-3 text-left ${template === t.value ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:bg-ink-50'}`}
            >
              <p className="text-sm font-medium text-ink-900">{t.label}</p>
              <p className="mt-0.5 text-xs text-ink-500">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Related Treatment</label>
        <select className={FIELD_CLASS} value={treatmentId} onChange={(e) => selectTreatment(e.target.value)}>
          <option value="">Not tied to a specific treatment</option>
          {treatments.map((t) => <option key={t.id} value={t.id}>{t.procedure_name} ({t.visit_date})</option>)}
        </select>
      </div>
      {!treatmentId && (
        <div>
          <label className={LABEL_CLASS}>Procedure Name</label>
          <input className={FIELD_CLASS} value={customProcedure} onChange={(e) => setCustomProcedure(e.target.value)} placeholder="e.g. Tooth Extraction" />
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Preview</label>
        <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-ink-200 bg-ink-50 p-3 text-xs leading-relaxed text-ink-600">
          {previewText}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving || !effectiveProcedure}>{saving ? 'Preparing...' : 'Prepare Consent Form'}</Button>
      </div>
    </div>
  );
}
