import { useState, type FormEvent } from 'react';
import type { Patient } from '../../types';
import type { PatientInput } from '../../api/patients';
import { Button } from '../common/Button';
import { calculateAge } from '../../lib/format';

interface PatientFormProps {
  initial?: Patient;
  onSubmit: (data: PatientInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-ink-700';

export function PatientForm({ initial, onSubmit, onCancel, submitLabel = 'Save Patient' }: PatientFormProps) {
  const [form, setForm] = useState<PatientInput>({
    first_name: initial?.first_name ?? '',
    middle_name: initial?.middle_name ?? '',
    last_name: initial?.last_name ?? '',
    nickname: initial?.nickname ?? '',
    dob: initial?.dob ?? '',
    sex: initial?.sex ?? '',
    civil_status: initial?.civil_status ?? '',
    religion: initial?.religion ?? '',
    nationality: initial?.nationality ?? 'Filipino',
    contact_number: initial?.contact_number ?? '',
    office_number: initial?.office_number ?? '',
    email: initial?.email ?? '',
    address: initial?.address ?? '',
    occupation: initial?.occupation ?? '',
    dental_insurance: initial?.dental_insurance ?? '',
    insurance_effective_date: initial?.insurance_effective_date ?? '',
    referral_source: initial?.referral_source ?? '',
    reason_for_consultation: initial?.reason_for_consultation ?? '',
    guardian_name: initial?.guardian_name ?? '',
    guardian_occupation: initial?.guardian_occupation ?? '',
    emergency_contact_name: initial?.emergency_contact_name ?? '',
    emergency_contact_number: initial?.emergency_contact_number ?? '',
    status: initial?.status ?? 'active',
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const age = calculateAge(form.dob);
  const isMinor = age !== null && age < 18;

  function set<K extends keyof PatientInput>(key: K, value: PatientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.first_name?.trim()) next.first_name = 'First name is required';
    if (!form.last_name?.trim()) next.last_name = 'Last name is required';
    if (form.contact_number && !/^[0-9+()\-.\s]{6,20}$/.test(form.contact_number)) {
      next.contact_number = 'Enter a valid contact number';
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL_CLASS}>First Name *</label>
          <input className={FIELD_CLASS} value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
          {errors.first_name && <p className="mt-1 text-xs text-rose-600">{errors.first_name}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>Middle Name</label>
          <input className={FIELD_CLASS} value={form.middle_name ?? ''} onChange={(e) => set('middle_name', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Last Name *</label>
          <input className={FIELD_CLASS} value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
          {errors.last_name && <p className="mt-1 text-xs text-rose-600">{errors.last_name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL_CLASS}>Nickname</label>
          <input className={FIELD_CLASS} value={form.nickname ?? ''} onChange={(e) => set('nickname', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Date of Birth {age !== null && <span className="font-normal text-ink-400">({age} yrs)</span>}</label>
          <input type="date" className={FIELD_CLASS} value={form.dob ?? ''} onChange={(e) => set('dob', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Sex</label>
          <select className={FIELD_CLASS} value={form.sex ?? ''} onChange={(e) => set('sex', e.target.value)}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL_CLASS}>Civil Status</label>
          <select className={FIELD_CLASS} value={form.civil_status ?? ''} onChange={(e) => set('civil_status', e.target.value)}>
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>Religion</label>
          <input className={FIELD_CLASS} value={form.religion ?? ''} onChange={(e) => set('religion', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Nationality</label>
          <input className={FIELD_CLASS} value={form.nationality ?? ''} onChange={(e) => set('nationality', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL_CLASS}>Contact Number</label>
          <input className={FIELD_CLASS} value={form.contact_number ?? ''} onChange={(e) => set('contact_number', e.target.value)} placeholder="09XX-XXX-XXXX" />
          {errors.contact_number && <p className="mt-1 text-xs text-rose-600">{errors.contact_number}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>Office Number</label>
          <input className={FIELD_CLASS} value={form.office_number ?? ''} onChange={(e) => set('office_number', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Email</label>
          <input type="email" className={FIELD_CLASS} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Address</label>
        <input className={FIELD_CLASS} value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>Occupation</label>
          <input className={FIELD_CLASS} value={form.occupation ?? ''} onChange={(e) => set('occupation', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Status</label>
          <select className={FIELD_CLASS} value={form.status ?? 'active'} onChange={(e) => set('status', e.target.value as Patient['status'])}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>Dental Insurance</label>
          <input className={FIELD_CLASS} value={form.dental_insurance ?? ''} onChange={(e) => set('dental_insurance', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Insurance Effective Date</label>
          <input type="date" className={FIELD_CLASS} value={form.insurance_effective_date ?? ''} onChange={(e) => set('insurance_effective_date', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>Whom may we thank for referring you?</label>
          <input className={FIELD_CLASS} value={form.referral_source ?? ''} onChange={(e) => set('referral_source', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Reason for Dental Consultation</label>
          <input className={FIELD_CLASS} value={form.reason_for_consultation ?? ''} onChange={(e) => set('reason_for_consultation', e.target.value)} />
        </div>
      </div>

      {isMinor && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-sm font-medium text-amber-800">Patient is a minor — parent/guardian details are needed for consent.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Parent / Guardian Name</label>
              <input className={FIELD_CLASS} value={form.guardian_name ?? ''} onChange={(e) => set('guardian_name', e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Guardian Occupation</label>
              <input className={FIELD_CLASS} value={form.guardian_occupation ?? ''} onChange={(e) => set('guardian_occupation', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>Emergency Contact Name</label>
          <input className={FIELD_CLASS} value={form.emergency_contact_name ?? ''} onChange={(e) => set('emergency_contact_name', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Emergency Contact Number</label>
          <input className={FIELD_CLASS} value={form.emergency_contact_number ?? ''} onChange={(e) => set('emergency_contact_number', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Notes</label>
        <textarea className={FIELD_CLASS} rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
