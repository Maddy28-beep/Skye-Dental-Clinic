import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserRound } from 'lucide-react';
import { patientsApi } from '../api/patients';
import type { Patient } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { FullPageSpinner } from '../components/common/Spinner';
import { PatientTable } from '../components/patients/PatientTable';
import { PatientForm } from '../components/patients/PatientForm';
import { useSession } from '../context/SessionContext';

export function PatientsListPage() {
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();

  function load(q?: string) {
    patientsApi.list(q).then(setPatients);
  }

  useEffect(() => {
    const handle = setTimeout(() => load(query || undefined), 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = (patients ?? []).filter((p) => statusFilter === 'all' || p.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">Patients</h1>
          <p className="text-sm text-ink-500">Manage patient records and profiles.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Add Patient
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 sm:max-w-xs">
            <Search size={16} className="text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, or contact"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-2 text-sm font-medium capitalize ${
                  statusFilter === s ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {!patients ? (
          <FullPageSpinner />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<UserRound size={32} />}
              title="No patients found"
              description="Try a different search, or register a new patient."
              action={<Button onClick={() => setShowAdd(true)}>Add Patient</Button>}
            />
          </div>
        ) : (
          <PatientTable patients={filtered} />
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register New Patient" size="lg">
        <PatientForm
          onCancel={() => setShowAdd(false)}
          onSubmit={async (data) => {
            const created = await patientsApi.create({ ...data, recorded_by: session.name, role: session.role });
            setShowAdd(false);
            navigate(`/patients/${created.id}`);
          }}
          submitLabel="Register Patient"
        />
      </Modal>
    </div>
  );
}
