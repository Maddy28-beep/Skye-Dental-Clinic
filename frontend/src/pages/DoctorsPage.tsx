import { useEffect, useState } from 'react';
import { Plus, UserCog, Lock, ShieldOff, ShieldCheck } from 'lucide-react';
import { doctorsApi } from '../api/doctors';
import { ApiError } from '../api/client';
import type { Doctor } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { FullPageSpinner } from '../components/common/Spinner';

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);

  function load() {
    doctorsApi.list().then(setDoctors);
  }

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">Doctors & Staff</h1>
          <p className="text-sm text-ink-500">Manage dentist accounts and their PIN used for payment verification.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add Doctor</Button>
      </div>

      <Card>
        {!doctors ? (
          <FullPageSpinner />
        ) : doctors.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<UserCog size={32} />} title="No doctors yet" description="Add a doctor account so payments can be verified." action={<Button onClick={() => setShowAdd(true)}>Add Doctor</Button>} />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {doctors.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <UserCog size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-ink-900">{d.name}</p>
                    <p className="text-xs text-ink-400">{d.specialty || 'General Dentistry'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Inactive'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setEditing(d)}>
                    <Lock size={14} /> Manage PIN
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-ink-400">
        PINs are never displayed once set — they're stored as a salted hash. A doctor's identity is looked up purely
        from their PIN during payment verification, so no one can attribute a confirmation to the wrong doctor.
      </p>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Doctor Account" size="sm">
        <DoctorForm onCancel={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      </Modal>

      {editing && (
        <Modal open={!!editing} onClose={() => setEditing(null)} title={`Manage ${editing.name}`} size="sm">
          <DoctorForm
            doctor={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }}
          />
        </Modal>
      )}
    </div>
  );
}

function DoctorForm({ doctor, onCancel, onSaved }: { doctor?: Doctor; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(doctor?.name ?? '');
  const [specialty, setSpecialty] = useState(doctor?.specialty ?? '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [active, setActive] = useState(doctor ? !!doctor.active : true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fieldClass = 'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  async function handleSubmit() {
    setError('');
    if (!name.trim()) return setError('Name is required.');
    if (!doctor && !pin) return setError('Set an initial PIN for this doctor.');
    if (pin && pin !== confirmPin) return setError('PINs do not match.');
    if (pin && !/^\d{4,6}$/.test(pin)) return setError('PIN must be 4-6 digits.');

    setSaving(true);
    try {
      if (doctor) {
        await doctorsApi.update(doctor.id, { name, specialty, active, ...(pin ? { pin } : {}) });
      } else {
        await doctorsApi.create({ name, specialty, pin });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Full Name</label>
        <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Juan Dela Cruz" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Specialty</label>
        <input className={fieldClass} value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="General Dentistry" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">{doctor ? 'New PIN' : 'PIN'}</label>
          <input type="password" inputMode="numeric" maxLength={6} className={fieldClass} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4-6 digits" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Confirm PIN</label>
          <input type="password" inputMode="numeric" maxLength={6} className={fieldClass} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>
      {doctor && (
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Active (can verify payments)
        </label>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {active ? <ShieldCheck size={16} /> : <ShieldOff size={16} />} {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
