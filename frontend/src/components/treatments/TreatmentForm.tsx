import { useState } from 'react';
import type { Doctor, Treatment, TreatmentStatus } from '../../types';
import type { TreatmentInput } from '../../api/treatments';
import { Button } from '../common/Button';
import { formatCurrency } from '../../lib/format';

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-ink-700';

const PROCEDURES = [
  'Consultation', 'Dental Cleaning', 'Tooth Extraction', 'Tooth Filling', 'Root Canal Treatment',
  'Crown', 'Denture', 'Orthodontic Procedure', 'Whitening', 'X-ray', 'Other',
];

const STATUSES: TreatmentStatus[] = ['planned', 'in_progress', 'completed', 'cancelled'];

interface TreatmentFormProps {
  initial?: Treatment;
  doctors: Doctor[];
  onSubmit: (data: TreatmentInput) => Promise<void>;
  onCancel: () => void;
}

export function TreatmentForm({ initial, doctors, onSubmit, onCancel }: TreatmentFormProps) {
  const [procedureName, setProcedureName] = useState(initial?.procedure_name ?? PROCEDURES[0]);
  const [customProcedure, setCustomProcedure] = useState(initial && !PROCEDURES.includes(initial.procedure_name) ? initial.procedure_name : '');
  const [doctorId, setDoctorId] = useState(initial?.doctor_id ?? '');
  const [toothNumbers, setToothNumbers] = useState(initial?.tooth_numbers?.join(', ') ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<TreatmentStatus>(initial?.status ?? 'planned');
  const [cost, setCost] = useState(initial ? String(initial.cost) : '');
  const [discount, setDiscount] = useState(initial ? String(initial.discount) : '0');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [visitDate, setVisitDate] = useState(initial?.visit_date ?? new Date().toISOString().slice(0, 10));
  const [nextAppointmentDate, setNextAppointmentDate] = useState(initial?.next_appointment_date ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const finalAmount = Math.max(0, (Number(cost) || 0) - (Number(discount) || 0));

  async function handleSubmit() {
    const name = procedureName === 'Other' ? customProcedure.trim() : procedureName;
    if (!name) {
      setError('Please specify the procedure name.');
      return;
    }
    if (!cost || Number(cost) < 0) {
      setError('Enter a valid treatment cost.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        procedure_name: name,
        doctor_id: doctorId || null,
        tooth_numbers: toothNumbers.split(',').map((t) => t.trim()).filter(Boolean),
        description: description || null,
        status,
        cost: Number(cost),
        discount: Number(discount) || 0,
        notes: notes || null,
        visit_date: visitDate,
        next_appointment_date: nextAppointmentDate || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>Procedure</label>
          <select className={FIELD_CLASS} value={procedureName} onChange={(e) => setProcedureName(e.target.value)}>
            {PROCEDURES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {procedureName === 'Other' && (
          <div>
            <label className={LABEL_CLASS}>Specify Procedure</label>
            <input className={FIELD_CLASS} value={customProcedure} onChange={(e) => setCustomProcedure(e.target.value)} />
          </div>
        )}
        <div>
          <label className={LABEL_CLASS}>Dentist</label>
          <select className={FIELD_CLASS} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Unassigned</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL_CLASS}>Tooth Number(s)</label>
          <input className={FIELD_CLASS} value={toothNumbers} onChange={(e) => setToothNumbers(e.target.value)} placeholder="e.g. 36, 37" />
        </div>
        <div>
          <label className={LABEL_CLASS}>Visit Date</label>
          <input type="date" className={FIELD_CLASS} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Status</label>
          <select className={FIELD_CLASS} value={status} onChange={(e) => setStatus(e.target.value as TreatmentStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Next Appointment</label>
        <input type="date" className={FIELD_CLASS} value={nextAppointmentDate} onChange={(e) => setNextAppointmentDate(e.target.value)} />
      </div>

      <div>
        <label className={LABEL_CLASS}>Description / Notes for this treatment</label>
        <textarea className={FIELD_CLASS} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL_CLASS}>Treatment Cost (PHP)</label>
          <input type="number" min="0" step="0.01" className={FIELD_CLASS} value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Discount (PHP)</label>
          <input type="number" min="0" step="0.01" className={FIELD_CLASS} value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Final Amount</label>
          <div className="rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm font-semibold text-ink-900">
            {formatCurrency(finalAmount)}
          </div>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Other Notes</label>
        <textarea className={FIELD_CLASS} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Treatment'}</Button>
      </div>
    </div>
  );
}
