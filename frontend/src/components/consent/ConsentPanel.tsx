import { useEffect, useState } from 'react';
import { FileSignature, Plus, Eye } from 'lucide-react';
import type { Consent, Treatment } from '../../types';
import { consentsApi } from '../../api/consents';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { NewConsentForm } from './NewConsentForm';
import { ConsentSignForm } from './ConsentForm';
import { formatDateTime, calculateAge } from '../../lib/format';
import { useSession } from '../../context/SessionContext';

export function ConsentPanel({
  patientId, patientName, patientDob, treatments,
}: { patientId: string; patientName: string; patientDob: string | null; treatments: Treatment[] }) {
  const age = calculateAge(patientDob);
  const isMinor = age !== null && age < 18;
  const [consents, setConsents] = useState<Consent[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [signing, setSigning] = useState<Consent | null>(null);
  const [viewing, setViewing] = useState<Consent | null>(null);
  const { session } = useSession();

  function load() {
    consentsApi.listByPatient(patientId).then(setConsents);
  }

  useEffect(load, [patientId]);

  return (
    <Card>
      <CardHeader
        title="Dental Consent"
        subtitle="Patients sign directly on this device — no signature pad required."
        action={<Button size="sm" onClick={() => setShowNew(true)}><Plus size={16} /> New Consent</Button>}
      />
      <CardBody>
        {!consents ? null : consents.length === 0 ? (
          <EmptyState
            icon={<FileSignature size={32} />}
            title="No consent forms yet"
            description="Prepare a consent form for an upcoming procedure so the patient can sign it here."
            action={<Button onClick={() => setShowNew(true)}>Prepare Consent Form</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {consents.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 rounded-xl border border-ink-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink-900">{c.procedure_name}</p>
                    <span className="text-xs text-ink-400">v{c.version}</span>
                    <Badge tone="neutral">{c.template === 'oral_surgery' ? 'Oral Surgery' : 'General'}</Badge>
                    {c.status === 'signed' ? <Badge tone="success">Signed</Badge> : <Badge tone="warning">Awaiting Signature</Badge>}
                  </div>
                  <p className="text-xs text-ink-400">
                    {c.status === 'signed' ? `Signed by ${c.signed_name} · ${formatDateTime(c.signed_at)}` : `Prepared ${formatDateTime(c.created_at)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {c.status === 'draft' ? (
                    <Button size="sm" onClick={() => setSigning(c)}><FileSignature size={15} /> Sign Now</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setViewing(c)}><Eye size={15} /> View</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Prepare Dental Consent" size="lg">
        <NewConsentForm
          treatments={treatments}
          onCancel={() => setShowNew(false)}
          onSubmit={async (data) => {
            await consentsApi.create({ ...data, patient_id: patientId, recorded_by: session.name, role: session.role });
            setShowNew(false);
            load();
          }}
        />
      </Modal>

      {signing && (
        <Modal open={!!signing} onClose={() => setSigning(null)} title="Dental Treatment Consent" subtitle={patientName} size="lg">
          <ConsentSignForm
            consent={signing}
            defaultName={patientName}
            isMinor={isMinor}
            onCancel={() => setSigning(null)}
            onSubmit={async (data) => {
              await consentsApi.sign(signing.id, data);
              setSigning(null);
              load();
            }}
          />
        </Modal>
      )}

      {viewing && (
        <Modal open={!!viewing} onClose={() => setViewing(null)} title="Signed Consent" subtitle={viewing.procedure_name} size="md">
          <div className="space-y-4">
            {viewing.sections ? (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-ink-200 bg-ink-50 p-3">
                {viewing.sections.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2 border-b border-ink-100 pb-1.5 text-sm last:border-0">
                    <span className="text-ink-700">{s.label}</span>
                    <span className="rounded bg-white px-2 py-0.5 font-mono text-xs font-semibold text-ink-700 ring-1 ring-ink-200">{s.initials || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm leading-relaxed text-ink-700">{viewing.consent_text}</div>
            )}

            {viewing.anesthesia && (
              <div className="text-sm">
                <p className="mb-1 text-ink-400">Anesthesia / Sedation Consent</p>
                <p className="text-ink-800">
                  {[
                    viewing.anesthesia.local_anesthesia && 'Local Anesthesia',
                    viewing.anesthesia.nitrous_oxide && 'Nitrous Oxide',
                    viewing.anesthesia.oral_sedation && 'Oral Sedation',
                  ].filter(Boolean).join(', ') || 'None selected'}
                </p>
              </div>
            )}

            {viewing.signature_data && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-700">Signature</p>
                <div className="rounded-xl border border-ink-200 bg-white p-2">
                  <img src={viewing.signature_data} alt="Patient signature" className="max-h-40 w-full object-contain" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-ink-400">Signed By</p><p className="font-medium text-ink-900">{viewing.signed_name}</p></div>
              <div><p className="text-ink-400">Signed At</p><p className="font-medium text-ink-900">{formatDateTime(viewing.signed_at)}</p></div>
              {viewing.witness_name && <div><p className="text-ink-400">Witness</p><p className="font-medium text-ink-900">{viewing.witness_name}</p></div>}
              {viewing.guardian_name && <div><p className="text-ink-400">Parent / Guardian</p><p className="font-medium text-ink-900">{viewing.guardian_name}</p></div>}
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
