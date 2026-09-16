import { callFunction } from './client';
import { queryDocs, updateDocById, orderBy } from './firestoreHelpers';
import type { Doctor } from '../types';

export const doctorsApi = {
  list: () => queryDocs<Doctor>('doctors', orderBy('name')),

  create: (data: { name: string; specialty?: string; pin: string }) =>
    callFunction<Doctor>('createDoctor', data),

  update: (id: string, data: Partial<{ name: string; specialty: string; active: boolean; pin: string }>) =>
    callFunction<Doctor>('updateDoctor', { doctorId: id, ...data }),

  // Deactivating (rather than deleting) preserves the doctor's history on past
  // treatments/payments/consents, which still reference this id.
  remove: (id: string) => updateDocById<Doctor>('doctors', id, { active: false }),

  verifyPin: (pin: string) => callFunction<Doctor>('verifyDoctorPin', { pin }),
};
