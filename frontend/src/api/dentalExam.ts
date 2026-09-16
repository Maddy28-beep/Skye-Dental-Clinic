import type { DentalExam } from '../types';
import { getDocById, setDocById, nowIso, logAudit } from './firestoreHelpers';

export const dentalExamApi = {
  get: (patientId: string) => getDocById<DentalExam>('dental_exams', patientId),

  async save(patientId: string, data: Partial<DentalExam> & { recorded_by?: string; role?: string }) {
    const saved = await setDocById<DentalExam>('dental_exams', patientId, {
      ...data,
      patient_id: patientId,
      recorded_by: data.recorded_by || null,
      updated_at: nowIso(),
    } as Partial<DentalExam>);

    logAudit({
      userName: data.recorded_by || 'Staff', role: data.role || 'dentist',
      action: 'update', entityType: 'dental_exam', entityId: patientId, patientId,
      description: 'Intraoral examination findings updated',
    });

    return saved;
  },
};
