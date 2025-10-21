"use client";
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  if (!visible) return null;

  const onInstall = async () => {
    try {
      await deferred?.prompt();
    } finally {
      setVisible(false);
      setDeferred(null);
    }
  };

  return (
    <div className="fixed bottom-4 inset-x-0 mx-auto w-[92%] md:w-[520px] rounded-xl border bg-white shadow-lg p-3 z-50">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <div className="font-medium">Installeer de app</div>
          <div className="text-gray-600">Voor snelle toegang en pushmeldingen</div>
        </div>
        <div className="flex gap-2">
          <button className="text-sm px-3 py-1 border rounded" onClick={() => setVisible(false)}>Later</button>
          <button className="text-sm px-3 py-1 bg-black text-white rounded" onClick={onInstall}>Installeren</button>
        </div>
      </div>
    </div>
  );
}

