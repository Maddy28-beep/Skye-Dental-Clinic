import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { Role } from '../types';
import { LoginPage } from '../pages/LoginPage';
import { FullPageSpinner } from '../components/common/Spinner';

export interface Session {
  uid: string;
  name: string;
  role: Role;
  email: string | null;
}

interface SessionContextValue {
  session: Session;
  signOutUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  assistant: 'Dental Assistant',
  dentist: 'Dentist / Doctor',
};

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  return 'Sign in failed. Please try again.';
}

// Real Firebase Auth login gates the whole app: SessionProvider renders the LoginPage
// itself (instead of `children`) until someone is signed in, so every consumer of
// useSession() can safely assume `session` is non-null.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'signedOut' | 'signedIn'>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setSession(null);
        setStatus('signedOut');
        return;
      }
      const staffSnap = await getDoc(doc(db, 'staff', user.uid));
      const staff = staffSnap.exists() ? (staffSnap.data() as { name: string; role: Role }) : null;
      setSession({
        uid: user.uid,
        name: staff?.name || user.displayName || user.email || 'Staff',
        role: staff?.role || 'assistant',
        email: user.email,
      });
      setStatus('signedIn');
    });
    return unsub;
  }, []);

  async function handleSignIn(email: string, password: string) {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(mapAuthError(err));
      throw err;
    }
  }

  async function signOutUser() {
    await signOut(auth);
  }

  if (status === 'loading') return <FullPageSpinner label="Loading..." />;
  if (status === 'signedOut' || !session) {
    return <LoginPage onSignIn={handleSignIn} error={authError} />;
  }

  return <SessionContext.Provider value={{ session, signOutUser }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
