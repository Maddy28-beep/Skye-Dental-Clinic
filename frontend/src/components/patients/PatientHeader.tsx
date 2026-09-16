import { ArrowLeft, Mail, MapPin, Phone, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { calculateAge, formatDate, initials } from '../../lib/format';

export function PatientHeader({ patient, onEdit }: { patient: Patient; onEdit: () => void }) {
  const navigate = useNavigate();
  const age = calculateAge(patient.dob);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
      <button
        onClick={() => navigate('/patients')}
        className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft size={16} /> Back to Patients
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700 sm:h-16 sm:w-16">
            {initials(patient.first_name, patient.last_name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-ink-900 sm:text-xl">
                {patient.first_name} {patient.middle_name ? `${patient.middle_name} ` : ''}{patient.last_name}
              </h1>
              <Badge tone={patient.status === 'active' ? 'success' : 'neutral'}>{patient.status}</Badge>
            </div>
            <p className="text-sm text-ink-500">
              {patient.patient_code} &middot; {age !== null ? `${age} years old` : 'Age unknown'} {patient.sex ? `· ${patient.sex}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
              {patient.contact_number && (
                <span className="flex items-center gap-1"><Phone size={14} className="text-ink-400" /> {patient.contact_number}</span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1"><Mail size={14} className="text-ink-400" /> {patient.email}</span>
              )}
              {patient.address && (
                <span className="flex items-center gap-1"><MapPin size={14} className="text-ink-400" /> {patient.address}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-400">Registered {formatDate(patient.created_at)}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onEdit}>
          <Pencil size={16} /> Edit Info
        </Button>
      </div>
    </div>
  );
}
