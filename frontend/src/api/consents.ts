import type { Consent, ConsentAnesthesia, ConsentSection, ConsentTemplate } from '../types';
import { createDoc, getDocById, updateDocById, queryDocs, where, orderBy, nowIso, logAudit } from './firestoreHelpers';

export const consentsApi = {
  listByPatient: (patientId: string) =>
    queryDocs<Consent>('consents', where('patient_id', '==', patientId), orderBy('created_at', 'desc')),

  get: (id: string) => getDocById<Consent>('consents', id),

  async create(data: {
    patient_id: string;
    treatment_id?: string | null;
    template?: ConsentTemplate;
    procedure_name: string;
    consent_text: string;
    sections?: ConsentSection[];
    dentist_id?: string | null;
    recorded_by?: string;
    role?: string;
  }) {
    const priorVersions = await queryDocs<Consent>(
      'consents',
      where('patient_id', '==', data.patient_id),
      where('procedure_name', '==', data.procedure_name)
    );
    const version = (priorVersions.reduce((max, c) => Math.max(max, c.version || 0), 0)) + 1;

    const created = await createDoc<Consent>('consents', {
      patient_id: data.patient_id,
      treatment_id: data.treatment_id || null,
      template: data.template || 'general',
      procedure_name: data.procedure_name,
      consent_text: data.consent_text,
      sections: data.sections || null,
      anesthesia: null,
      version,
      signature_data: null,
      signed_name: null,
      witness_name: null,
      guardian_name: null,
      dentist_id: data.dentist_id || null,
      status: 'draft',
      signed_at: null,
      superseded_by: null,
      created_by: data.recorded_by || null,
      created_by_role: data.role || null,
      created_at: nowIso(),
    } as unknown as Consent);

    logAudit({
      userName: data.recorded_by || 'Staff', role: data.role || 'assistant',
      action: 'create', entityType: 'consent', entityId: created.id, patientId: data.patient_id,
      description: `Consent form prepared for "${data.procedure_name}" (v${version})`,
    });

    return created;
  },

  async sign(
    id: string,
    data: {
      signature_data: string;
      signed_name: string;
      witness_name?: string;
      guardian_name?: string;
      sections?: ConsentSection[];
      anesthesia?: ConsentAnesthesia;
    }
  ) {
    const existing = await getDocById<Consent>('consents', id);
    const updated = await updateDocById<Consent>('consents', id, {
      signature_data: data.signature_data,
      signed_name: data.signed_name,
      witness_name: data.witness_name || null,
      guardian_name: data.guardian_name || null,
      sections: data.sections ?? undefined,
      anesthesia: data.anesthesia || null,
      status: 'signed',
      signed_at: nowIso(),
    } as Partial<Consent>);

    logAudit({
      userName: data.signed_name, role: 'patient', action: 'sign',
      entityType: 'consent', entityId: id, patientId: existing?.patient_id,
      description: `Consent for "${existing?.procedure_name}" signed by ${data.signed_name}`,
    });

    return updated;
  },

  async newVersion(id: string, data: { consent_text?: string; sections?: ConsentSection[]; recorded_by?: string; role?: string }) {
    const existing = await getDocById<Consent>('consents', id);
    if (!existing) throw new Error('Consent not found');

    const created = await createDoc<Consent>('consents', {
      patient_id: existing.patient_id,
      treatment_id: existing.treatment_id,
      template: existing.template,
      procedure_name: existing.procedure_name,
      consent_text: data.consent_text || existing.consent_text,
      sections: data.sections || existing.sections,
      anesthesia: null,
      version: existing.version + 1,
      signature_data: null,
      signed_name: null,
      witness_name: null,
      guardian_name: null,
      dentist_id: existing.dentist_id,
      status: 'draft',
      signed_at: null,
      superseded_by: null,
      created_by: data.recorded_by || null,
      created_by_role: data.role || null,
      created_at: nowIso(),
    } as unknown as Consent);

    await updateDocById<Consent>('consents', id, { superseded_by: created.id } as Partial<Consent>);

    logAudit({
      userName: data.recorded_by || 'Staff', role: data.role || 'assistant',
      action: 'create', entityType: 'consent', entityId: created.id, patientId: existing.patient_id,
      description: `New consent version (v${existing.version + 1}) created for "${existing.procedure_name}"`,
    });

    return created;
  },
};
