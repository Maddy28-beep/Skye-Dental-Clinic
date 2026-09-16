import type { MedicalHistory } from '../types';
import { getDocById, setDocById, nowIso, logAudit } from './firestoreHelpers';

export const medicalHistoryApi = {
  get: (patientId: string) => getDocById<MedicalHistory>('medical_histories', patientId),

  async save(patientId: string, data: Partial<MedicalHistory> & { recorded_by?: string; role?: string }) {
    const { recorded_by, role, ...fields } = data;
    const saved = await setDocById<MedicalHistory>('medical_histories', patientId, {
      ...fields,
      patient_id: patientId,
      updated_by: recorded_by || null,
      updated_by_role: role || null,
      updated_at: nowIso(),
    } as Partial<MedicalHistory>);

    logAudit({
      userName: recorded_by || 'Staff', role: role || 'assistant',
      action: 'update', entityType: 'medical_history', entityId: patientId, patientId,
      description: 'Medical & dental history updated',
    });

    return saved;
  },
};
