import type { AuditLogEntry } from '../types';
import { queryDocs, where, orderBy, limit } from './firestoreHelpers';

export const auditLogApi = {
  list: (params?: { patientId?: string; entityType?: string; limit?: number }) => {
    const constraints = [];
    if (params?.patientId) constraints.push(where('patient_id', '==', params.patientId));
    if (params?.entityType) constraints.push(where('entity_type', '==', params.entityType));
    constraints.push(orderBy('created_at', 'desc'));
    constraints.push(limit(params?.limit || 200));
    return queryDocs<AuditLogEntry>('audit_logs', ...constraints);
  },
};
