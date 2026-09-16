import type { Patient, Treatment, TreatmentStatus } from '../types';
import { createDoc, getDocById, updateDocById, queryDocs, where, orderBy, limit, nowIso, logAudit } from './firestoreHelpers';

export type TreatmentInput = Partial<
  Omit<Treatment, 'id' | 'created_at' | 'final_amount' | 'tooth_numbers'>
> & { tooth_numbers?: string[]; recorded_by?: string; role?: string };

// The old backend joined patients in SQL for the global (cross-patient) list views;
// Firestore has no joins, so we batch-fetch the distinct patients involved instead.
async function withPatientNames(treatments: Treatment[]): Promise<Treatment[]> {
  const ids = [...new Set(treatments.map((t) => t.patient_id))];
  const patients = await Promise.all(ids.map((id) => getDocById<Patient>('patients', id)));
  const byId = new Map(patients.filter(Boolean).map((p) => [p!.id, p!]));
  return treatments.map((t) => {
    const p = byId.get(t.patient_id);
    return p ? { ...t, first_name: p.first_name, last_name: p.last_name } : t;
  });
}

export const treatmentsApi = {
  listByPatient: (patientId: string) =>
    queryDocs<Treatment>('treatments', where('patient_id', '==', patientId), orderBy('visit_date', 'desc')),

  async list(params?: { status?: string; from?: string; to?: string }) {
    const constraints = params?.status
      ? [where('status', '==', params.status), orderBy('visit_date', 'desc'), limit(200)]
      : [orderBy('visit_date', 'desc'), limit(200)];
    const rows = await queryDocs<Treatment>('treatments', ...constraints);
    return withPatientNames(rows);
  },

  async create(data: TreatmentInput) {
    const { recorded_by, role, patient_id, cost = 0, discount = 0, ...fields } = data;
    const final_amount = Math.max(0, Number(cost) - Number(discount));
    const created = await createDoc<Treatment>('treatments', {
      ...fields,
      patient_id,
      tooth_numbers: data.tooth_numbers ?? [],
      cost, discount, final_amount,
      status: (fields.status as TreatmentStatus) ?? 'planned',
      visit_date: fields.visit_date ?? new Date().toISOString().slice(0, 10),
      created_by: recorded_by || null,
      created_by_role: role || null,
      created_at: nowIso(),
    } as unknown as Treatment);

    const patient = patient_id ? await getDocById<Patient>('patients', patient_id) : null;
    logAudit({
      userName: recorded_by || 'Staff', role: role || 'assistant',
      action: 'create', entityType: 'treatment', entityId: created.id, patientId: patient_id,
      description: `${created.procedure_name} recorded for ${patient?.first_name || ''} ${patient?.last_name || ''}`,
    });

    return created;
  },

  async update(id: string, data: TreatmentInput) {
    const existing = await getDocById<Treatment>('treatments', id);
    const { recorded_by, role, ...fields } = data;
    const cost = fields.cost ?? existing?.cost ?? 0;
    const discount = fields.discount ?? existing?.discount ?? 0;
    const updated = await updateDocById<Treatment>('treatments', id, {
      ...fields,
      final_amount: Math.max(0, Number(cost) - Number(discount)),
      updated_by: recorded_by || null,
      updated_by_role: role || null,
    } as Partial<Treatment>);

    logAudit({
      userName: recorded_by || 'Staff', role: role || 'assistant',
      action: 'update', entityType: 'treatment', entityId: id, patientId: existing?.patient_id,
      description: `Treatment "${updated?.procedure_name}" updated${fields.status && existing?.status !== fields.status ? ` (status: ${fields.status})` : ''}`,
    });

    return updated;
  },
};
