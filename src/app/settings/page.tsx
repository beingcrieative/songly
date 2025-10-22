"use client";

import { db } from '@/lib/db';
import ChatHeader from '@/components/mobile/ChatHeader';
import NavTabs from '@/components/mobile/NavTabs';
import LanguageToggle from '@/components/LanguageToggle';

export default function SettingsPage() {
  const auth = db.useAuth();

  const handleLogout = async () => {
    try {
      await db.auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <div className="min-h-[100svh] bg-white">
        <ChatHeader title="Instellingen" />
        <main className="mx-auto max-w-md p-4 pb-28 space-y-4">
          {auth.user && (
            <section className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/90 p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-secondary)' }}>Account</h2>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-[rgba(15,23,42,0.6)]">Ingelogd als:</span>
                  <div className="mt-1 font-medium text-[rgba(15,23,42,0.9)]">{auth.user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 active:bg-rose-700"
                >
                  Uitloggen
                </button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/90 p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-secondary)' }}>Taal</h2>
            <LanguageToggle />
          </section>
        </main>
      </div>
      <NavTabs />
    </>
  );
}

