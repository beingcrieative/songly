"use client";
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

const isIOS = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

const isInStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return (window.navigator as any).standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches;
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isInStandaloneMode()) {
      return;
    }

    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const dayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < dayInMs * 7) {
        // Don't show again for 7 days
        return;
      }
    }

    // For iOS devices, show iOS-specific prompt after a delay
    if (isIOS()) {
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    }

    // For Chrome/Edge/Android, use beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  const onDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setVisible(false);
    setShowIOSPrompt(false);
    setDeferred(null);
  };

  const onInstall = async () => {
    try {
      await deferred?.prompt();
    } finally {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      setVisible(false);
      setDeferred(null);
    }
  };

  // iOS Install Prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-4 inset-x-0 mx-auto w-[92%] md:w-[520px] rounded-xl border bg-white shadow-lg p-4 z-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="font-medium mb-2">Installeer Liefdesliedje Studio</div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Tap het <strong>Deel</strong> icoon onderaan je scherm</p>
              <p>Kies <strong>"Zet op beginscherm"</strong></p>
              <p>Tap <strong>"Voeg toe"</strong></p>
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            onClick={onDismiss}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Chrome/Android Install Prompt
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 mx-auto w-[92%] md:w-[520px] rounded-xl border bg-white shadow-lg p-3 z-50">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <div className="font-medium">Installeer de app</div>
          <div className="text-gray-600">Voor snelle toegang en pushmeldingen</div>
        </div>
        <div className="flex gap-2">
          <button className="text-sm px-3 py-1 border rounded" onClick={onDismiss}>Later</button>
          <button className="text-sm px-3 py-1 bg-black text-white rounded" onClick={onInstall}>Installeren</button>
        </div>
      </div>
    </div>
  );
}

