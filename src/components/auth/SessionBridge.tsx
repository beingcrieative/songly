"use client";
import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { db } from '@/lib/db';

// Context to track session readiness
const SessionReadyContext = createContext<{
  isReady: boolean;
  setReady: (ready: boolean) => void;
}>({
  isReady: false,
  setReady: () => {},
});

export function useSessionReady() {
  const context = useContext(SessionReadyContext);
  const auth = db.useAuth();

  // If no user, session is "ready" (they're logged out)
  if (!auth.user) {
    return true;
  }

  return context.isReady;
}

export function SessionReadyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  const setReady = (ready: boolean) => {
    setIsReady(ready);
  };

  return (
    <SessionReadyContext.Provider value={{ isReady, setReady }}>
      {children}
    </SessionReadyContext.Provider>
  );
}

export default function SessionBridge() {
  const auth = db.useAuth();
  const { setReady } = useContext(SessionReadyContext);
  const syncedUserId = useRef<string | null>(null);
  const logoutInFlight = useRef(false);

  useEffect(() => {
    if (auth.isLoading) return;

    const instantUser = auth.user || null;

    if (instantUser?.id) {
      logoutInFlight.current = false;
      if (syncedUserId.current === instantUser.id) {
        setReady(true);
        return;
      }

      console.log('[SessionBridge] Exchanging session for user:', instantUser.id);
      const payload = { userId: instantUser.id, email: instantUser.email ?? null };
      fetch('/api/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Exchange failed: ${res.status}`);
          }
          return res.json();
        })
        .then(() => {
          console.log('[SessionBridge] ✓ Session ready');
          syncedUserId.current = instantUser.id;
          setReady(true);
        })
        .catch((error) => {
          console.error('[SessionBridge] ✗ Exchange failed, proceeding anyway:', error);
          // Still mark as ready so user can proceed
          setReady(true);
        });
      return;
    }

    // user signed out of Instant; clear server session
    if (syncedUserId.current && !logoutInFlight.current) {
      logoutInFlight.current = true;
      setReady(false);
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).finally(() => {
        syncedUserId.current = null;
        logoutInFlight.current = false;
      });
    }
  }, [auth.isLoading, auth.user?.id, auth.user?.email, setReady]);

  return null;
}

