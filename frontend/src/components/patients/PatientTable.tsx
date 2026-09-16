import { useNavigate } from 'react-router-dom';
import { ChevronRight, Phone } from 'lucide-react';
import type { Patient } from '../../types';
import { Badge } from '../common/Badge';
import { calculateAge, formatDate, initials } from '../../lib/format';

export function PatientTable({ patients }: { patients: Patient[] }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Patient ID</th>
              <th className="px-4 py-3 font-medium">Age / Sex</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {patients.map((p) => {
              const age = calculateAge(p.dob);
              return (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="cursor-pointer hover:bg-ink-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {initials(p.first_name, p.last_name)}
                      </div>
                      <span className="font-medium text-ink-900">{p.first_name} {p.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{p.patient_code}</td>
                  <td className="px-4 py-3 text-ink-500">{age !== null ? `${age} yrs` : '—'} {p.sex ? `· ${p.sex}` : ''}</td>
                  <td className="px-4 py-3 text-ink-500">{p.contact_number || '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-300"><ChevronRight size={18} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-ink-100 sm:hidden">
        {patients.map((p) => {
          const age = calculateAge(p.dob);
          return (
            <li key={p.id}>
              <button
                onClick={() => navigate(`/patients/${p.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-ink-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {initials(p.first_name, p.last_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900">{p.first_name} {p.last_name}</p>
                  <p className="truncate text-xs text-ink-400">
                    {p.patient_code} · {age !== null ? `${age} yrs` : '—'}
                  </p>
                  {p.contact_number && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                      <Phone size={12} /> {p.contact_number}
                    </p>
                  )}
                </div>
                <Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
