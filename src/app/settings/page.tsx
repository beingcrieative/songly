import ChatHeader from '@/components/mobile/ChatHeader';
import NavTabs from '@/components/mobile/NavTabs';
import LanguageToggle from '@/components/LanguageToggle';

export default function SettingsPage() {
  return (
    <>
      <div className="min-h-[100svh] bg-white">
        <ChatHeader title="Instellingen" />
        <main className="mx-auto max-w-md p-4 pb-28">
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

