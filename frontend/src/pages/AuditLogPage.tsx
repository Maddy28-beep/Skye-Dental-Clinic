import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { auditLogApi } from '../api/auditLog';
import type { AuditLogEntry } from '../types';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { FullPageSpinner } from '../components/common/Spinner';
import { Badge } from '../components/common/Badge';
import { formatDateTime } from '../lib/format';

const ENTITY_FILTERS = ['all', 'patient', 'treatment', 'payment', 'consent', 'tooth_record', 'medical_history', 'doctor'];

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [entity, setEntity] = useState('all');

  useEffect(() => {
    auditLogApi.list(entity === 'all' ? undefined : { entityType: entity }).then(setLogs);
  }, [entity]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">Audit Log</h1>
        <p className="text-sm text-ink-500">A read-only trail of who did what, and when. Entries cannot be edited or deleted.</p>
      </div>

      <Card>
        <div className="flex gap-2 overflow-x-auto border-b border-ink-100 p-4">
          {ENTITY_FILTERS.map((e) => (
            <button
              key={e}
              onClick={() => setEntity(e)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium capitalize ${
                entity === e ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {e.replace('_', ' ')}
            </button>
          ))}
        </div>

        {!logs ? (
          <FullPageSpinner />
        ) : logs.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<ScrollText size={32} />} title="No activity yet" />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-sm text-ink-900">{l.description}</p>
                  <p className="text-xs text-ink-400">{l.user_name} &middot; {formatDateTime(l.created_at)}</p>
                </div>
                <Badge tone="neutral">{l.entity_type.replace('_', ' ')}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
