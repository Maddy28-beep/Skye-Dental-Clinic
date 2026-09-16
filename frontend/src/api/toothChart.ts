import type { ToothRecord } from '../types';
import { createDoc, queryDocs, where, orderBy, nowIso, logAudit } from './firestoreHelpers';

export const toothChartApi = {
  // Latest record per tooth number: fetch full history (already ordered newest-first) and
  // keep only the first occurrence of each tooth_number.
  async current(patientId: string): Promise<ToothRecord[]> {
    const all = await queryDocs<ToothRecord>('tooth_records', where('patient_id', '==', patientId), orderBy('recorded_at', 'desc'));
    const seen = new Set<string>();
    const latest: ToothRecord[] = [];
    for (const r of all) {
      if (seen.has(r.tooth_number)) continue;
      seen.add(r.tooth_number);
      latest.push(r);
    }
    return latest;
  },

  history: (patientId: string, tooth?: string) => {
    const constraints = tooth
      ? [where('patient_id', '==', patientId), where('tooth_number', '==', tooth), orderBy('recorded_at', 'desc')]
      : [where('patient_id', '==', patientId), orderBy('recorded_at', 'desc')];
    return queryDocs<ToothRecord>('tooth_records', ...constraints);
  },

  record: (
    patientId: string,
    data: Pick<ToothRecord, 'tooth_number' | 'conditions' | 'existing_treatment' | 'planned_treatment' | 'notes' | 'dentist_id'> & {
      recorded_by?: string;
      role?: string;
    }
  ) => {
    const { recorded_by, role, ...fields } = data;
    return createDoc<ToothRecord>('tooth_records', {
      ...fields,
      patient_id: patientId,
      recorded_by: recorded_by || null,
      role: role || null,
      recorded_at: nowIso(),
    } as unknown as ToothRecord).then((created) => {
      logAudit({
        userName: recorded_by || 'Staff', role: role || 'dentist',
        action: 'update', entityType: 'tooth_record', entityId: created.id, patientId,
        description: `Tooth #${data.tooth_number} updated to "${data.conditions.join(', ')}"`,
      });
      return created;
    });
  },
};
