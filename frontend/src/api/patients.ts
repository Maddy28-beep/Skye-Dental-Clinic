import type { Patient, TimelineEvent } from '../types';
import {
  createDoc, getDocById, updateDocById, deleteDocById, queryDocs,
  where, orderBy, nextSequenceCode, nowIso, logAudit,
} from './firestoreHelpers';

export type PatientInput = Partial<
  Omit<Patient, 'id' | 'patient_code' | 'created_at' | 'updated_at'>
> & { recorded_by?: string; role?: string };

function matchesQuery(p: Patient, q: string) {
  const needle = q.toLowerCase();
  return (
    p.first_name?.toLowerCase().includes(needle) ||
    p.last_name?.toLowerCase().includes(needle) ||
    p.contact_number?.toLowerCase().includes(needle)
  );
}

export const patientsApi = {
  async list(q?: string) {
    const rows = await queryDocs<Patient>('patients', orderBy('created_at', 'desc'));
    return q ? rows.filter((p) => matchesQuery(p, q)) : rows;
  },

  get: (id: string) => getDocById<Patient>('patients', id),

  async create(data: PatientInput) {
    const { recorded_by, role, ...fields } = data;
    const year = new Date().getFullYear();
    const patient_code = await nextSequenceCode(`patients_${year}`, `P${year}`);
    const now = nowIso();
    const created = await createDoc<Patient>('patients', {
      ...fields,
      patient_code,
      status: fields.status ?? 'active',
      created_by: recorded_by || null,
      created_by_role: role || null,
      created_at: now,
      updated_at: now,
    } as unknown as Patient);

    logAudit({
      userName: recorded_by || 'Staff', role: role || 'assistant',
      action: 'create', entityType: 'patient', entityId: created.id, patientId: created.id,
      description: `New patient registered: ${created.first_name} ${created.last_name}`,
    });

    return created;
  },

  async update(id: string, data: PatientInput) {
    const { recorded_by, role, ...fields } = data;
    return updateDocById<Patient>('patients', id, {
      ...fields,
      updated_by: recorded_by || null,
      updated_by_role: role || null,
      updated_at: nowIso(),
    } as Partial<Patient>);
  },

  remove: (id: string) => deleteDocById('patients', id),

  // Chronological feed built by merging treatments, payments, consents, and tooth
  // updates client-side - mirrors what the old backend did in SQL, just assembled here.
  async timeline(id: string): Promise<TimelineEvent[]> {
    const [patient, treatments, payments, consents, toothRecords] = await Promise.all([
      getDocById<Patient>('patients', id),
      queryDocs<import('../types').Treatment>('treatments', where('patient_id', '==', id)),
      queryDocs<import('../types').Payment>('payments', where('patient_id', '==', id)),
      queryDocs<import('../types').Consent>('consents', where('patient_id', '==', id)),
      queryDocs<import('../types').ToothRecord>('tooth_records', where('patient_id', '==', id)),
    ]);

    const events: TimelineEvent[] = [];

    for (const t of treatments) {
      events.push({ type: 'treatment', at: t.created_at, title: t.procedure_name, detail: `Status: ${t.status}`, ref_id: t.id });
    }
    for (const p of payments) {
      events.push({ type: 'payment_recorded', at: p.created_at, title: `Payment recorded: PHP ${p.amount_paid}`, detail: `Recorded by ${p.recorded_by || 'staff'}`, ref_id: p.id });
      if (p.status === 'verified' && p.verified_at) {
        events.push({ type: 'payment_verified', at: p.verified_at, title: `Payment verified: PHP ${p.amount_paid}`, detail: `Verified by ${p.verified_by_doctor_name || 'doctor'}`, ref_id: p.id });
      }
    }
    for (const c of consents) {
      events.push({ type: 'consent_created', at: c.created_at, title: `Consent prepared: ${c.procedure_name}`, detail: `Version ${c.version}`, ref_id: c.id });
      if (c.status === 'signed' && c.signed_at) {
        events.push({ type: 'consent_signed', at: c.signed_at, title: `Consent signed: ${c.procedure_name}`, detail: `Signed by ${c.signed_name}`, ref_id: c.id });
      }
    }
    for (const tr of toothRecords) {
      events.push({ type: 'tooth_update', at: tr.recorded_at, title: `Tooth #${tr.tooth_number}: ${tr.conditions.join(', ')}`, detail: tr.notes || '', ref_id: tr.id });
    }
    if (patient) {
      events.push({ type: 'patient_registered', at: patient.created_at, title: 'Patient registered', detail: `${patient.first_name} ${patient.last_name}`, ref_id: id });
    }

    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return events;
  },
};
