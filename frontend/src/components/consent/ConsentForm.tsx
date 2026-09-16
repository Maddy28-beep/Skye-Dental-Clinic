import { useState } from 'react';
import { Check } from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { Button } from '../common/Button';
import type { Consent, ConsentAnesthesia, ConsentSection } from '../../types';
import { ORAL_SURGERY_RISKS } from '../../lib/consentTemplates';
import { initialsFromFullName } from '../../lib/format';

interface ConsentSignFormProps {
  consent: Consent;
  defaultName: string;
  isMinor?: boolean;
  onSubmit: (data: {
    signature_data: string;
    signed_name: string;
    witness_name?: string;
    guardian_name?: string;
    sections?: ConsentSection[];
    anesthesia?: ConsentAnesthesia;
  }) => Promise<void>;
  onCancel: () => void;
}

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function ConsentSignForm({ consent, defaultName, isMinor, onSubmit, onCancel }: ConsentSignFormProps) {
  const [signedName, setSignedName] = useState(defaultName);
  const [witnessName, setWitnessName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [sections, setSections] = useState<ConsentSection[]>(consent.sections ?? []);
  const [anesthesia, setAnesthesia] = useState<ConsentAnesthesia>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isGeneral = consent.template === 'general';

  const computedInitials = initialsFromFullName(signedName);

  function toggleInitial(key: string) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, initials: s.initials?.trim() ? '' : computedInitials } : s))
    );
  }

  async function handleSubmit() {
    if (!signedName.trim()) return setError('Please enter the patient (or guardian) name.');
    if (isMinor && !guardianName.trim()) return setError('A parent/guardian name is required for a minor patient.');
    if (isGeneral && sections.some((s) => !s.initials?.trim())) {
      return setError('Please initial every section before submitting.');
    }
    if (!agreed) return setError('The patient must confirm they read and understood the consent.');
    if (!signature) return setError('Please provide a signature.');

    setError('');
    setSaving(true);
    try {
      await onSubmit({
        signature_data: signature,
        signed_name: signedName.trim(),
        witness_name: witnessName.trim() || undefined,
        guardian_name: guardianName.trim() || undefined,
        sections: isGeneral ? sections : undefined,
        anesthesia: !isGeneral ? anesthesia : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-ink-700">Dental Treatment Consent &mdash; {consent.procedure_name}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Patient (or Guardian) Full Name</label>
          <input className={FIELD_CLASS} value={signedName} onChange={(e) => setSignedName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Witness / Interpreter (optional)</label>
          <input className={FIELD_CLASS} value={witnessName} onChange={(e) => setWitnessName(e.target.value)} />
        </div>
      </div>

      {isGeneral ? (
        <div>
          <p className="mb-2 text-xs text-ink-400">
            Tap "Initial" to mark each section as read and acknowledged &mdash; no typing needed, it uses the name entered above ({computedInitials || '—'}).
          </p>
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-ink-200 bg-ink-50 p-3">
            {sections.map((s) => {
              const done = !!s.initials?.trim();
              return (
                <div key={s.key} className="flex items-start gap-2 border-b border-ink-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink-700">{s.label}</p>
                    <p className="text-xs leading-relaxed text-ink-500">{s.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleInitial(s.key)}
                    disabled={!computedInitials}
                    title={!computedInitials ? 'Enter the patient/guardian name above first' : undefined}
                    className={`flex w-20 shrink-0 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      done
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-ink-300 bg-white text-ink-500 hover:border-brand-400 hover:text-brand-600'
                    }`}
                  >
                    {done ? (
                      <>
                        <Check size={13} /> {s.initials}
                      </>
                    ) : (
                      'Initial'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-ink-200 bg-ink-50 p-3 text-xs leading-relaxed text-ink-600">
          <p className="mb-2">I have been informed of the risks of this procedure, which may include:</p>
          <ol className="list-decimal space-y-1 pl-4">
            {ORAL_SURGERY_RISKS.map((r) => <li key={r}>{r}</li>)}
          </ol>
        </div>
      )}

      {!isGeneral && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">Anesthesia / Sedation Consent</p>
          <p className="mb-2 text-xs text-ink-400">I consent to the administration of (check all that apply):</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-checked:border-brand-400 has-checked:bg-brand-50">
              <input type="checkbox" checked={!!anesthesia.local_anesthesia} onChange={(e) => setAnesthesia((a) => ({ ...a, local_anesthesia: e.target.checked }))} className="h-4 w-4 accent-brand-600" />
              Local Anesthesia
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-checked:border-brand-400 has-checked:bg-brand-50">
              <input type="checkbox" checked={!!anesthesia.nitrous_oxide} onChange={(e) => setAnesthesia((a) => ({ ...a, nitrous_oxide: e.target.checked }))} className="h-4 w-4 accent-brand-600" />
              Nitrous Oxide Analgesia
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-checked:border-brand-400 has-checked:bg-brand-50">
              <input type="checkbox" checked={!!anesthesia.oral_sedation} onChange={(e) => setAnesthesia((a) => ({ ...a, oral_sedation: e.target.checked }))} className="h-4 w-4 accent-brand-600" />
              Oral Sedation
            </label>
          </div>
        </div>
      )}

      {(isMinor || !isGeneral) && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Parent / Legal Guardian Name {isMinor && <span className="text-rose-600">(required — patient is a minor)</span>}
          </label>
          <input className={FIELD_CLASS} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Patient Signature</label>
        <p className="mb-2 text-xs text-ink-400">Use a finger, stylus, or mouse to sign directly below &mdash; no signature pad needed.</p>
        <SignaturePad onChange={setSignature} />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
        I have read and understood this consent.
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Submitting...' : 'Submit Consent'}</Button>
      </div>
    </div>
  );
}
