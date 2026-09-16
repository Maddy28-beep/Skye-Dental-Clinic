import type { Patient, Payment, Treatment } from '../types';
import { callFunction } from './client';
import { createDoc, getDocById, queryDocs, where, orderBy, nowIso, logAudit } from './firestoreHelpers';

async function withNames(payments: Payment[]): Promise<Payment[]> {
  const patientIds = [...new Set(payments.map((p) => p.patient_id))];
  const treatmentIds = [...new Set(payments.map((p) => p.treatment_id).filter(Boolean) as string[])];
  const [patients, treatments] = await Promise.all([
    Promise.all(patientIds.map((id) => getDocById<Patient>('patients', id))),
    Promise.all(treatmentIds.map((id) => getDocById<Treatment>('treatments', id))),
  ]);
  const patientById = new Map(patients.filter(Boolean).map((p) => [p!.id, p!]));
  const treatmentById = new Map(treatments.filter(Boolean).map((t) => [t!.id, t!]));
  return payments.map((p) => {
    const patient = patientById.get(p.patient_id);
    const treatment = p.treatment_id ? treatmentById.get(p.treatment_id) : undefined;
    return {
      ...p,
      first_name: patient?.first_name,
      last_name: patient?.last_name,
      procedure_name: treatment?.procedure_name,
    };
  });
}

export const paymentsApi = {
  listByPatient: async (patientId: string) => {
    const rows = await queryDocs<Payment>('payments', where('patient_id', '==', patientId), orderBy('created_at', 'desc'));
    return withNames(rows);
  },

  async list(status?: string) {
    const rows = await queryDocs<Payment>(
      'payments',
      ...(status ? [where('status', '==', status), orderBy('created_at', 'desc')] : [orderBy('created_at', 'desc')])
    );
    return withNames(rows);
  },

  async pending() {
    const rows = await queryDocs<Payment>('payments', where('status', '==', 'pending'), orderBy('created_at', 'asc'));
    return withNames(rows);
  },

  async create(data: {
    patient_id: string;
    treatment_id?: string | null;
    amount_due: number;
    amount_paid: number;
    payment_method: string;
    recorded_by?: string;
    role?: string;
  }) {
    const balance = Math.max(0, Number(data.amount_due) - Number(data.amount_paid));
    const created = await createDoc<Payment>('payments', {
      ...data,
      treatment_id: data.treatment_id || null,
      balance,
      status: 'pending',
      verified_by_doctor_id: null,
      verified_by_doctor_name: null,
      verified_at: null,
      payment_date: new Date().toISOString().slice(0, 10),
      created_by_role: data.role || null,
      created_at: nowIso(),
    } as unknown as Payment);

    const patient = await getDocById<Patient>('patients', data.patient_id);
    logAudit({
      userName: data.recorded_by || 'Staff', role: data.role || 'assistant',
      action: 'create', entityType: 'payment', entityId: created.id, patientId: data.patient_id,
      description: `Payment of PHP ${Number(data.amount_paid).toLocaleString()} recorded for ${patient?.first_name || ''} ${patient?.last_name || ''}, pending doctor verification`,
    });

    return created;
  },

  verify: (id: string, pin: string) => callFunction<Payment>('verifyPayment', { paymentId: id, pin }),
};
