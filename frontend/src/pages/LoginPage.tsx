import { useState, type FormEvent } from 'react';
import { Stethoscope } from 'lucide-react';
import { Button } from '../components/common/Button';

const FIELD_CLASS =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function LoginPage({
  onSignIn,
  error,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  error?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSignIn(email.trim(), password);
    } catch {
      // error message is surfaced via the `error` prop from the auth provider
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Stethoscope size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink-900">Skye Dental Clinic</h1>
            <p className="text-sm text-ink-500">Clinic Monitoring System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <input
              type="email"
              autoComplete="username"
              required
              className={FIELD_CLASS}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              className={FIELD_CLASS}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-400">
          Staff accounts are created by a clinic admin. Contact yours if you don't have one yet.
        </p>
      </div>
    </div>
  );
}
