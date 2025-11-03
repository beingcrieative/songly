"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';
import { useI18n } from '@/providers/I18nProvider';
import { db } from '@/lib/db';
import { useActionItemsCount } from '@/hooks/useActionItemsCount';

export default function NavTabs() {
  const p = usePathname();
  const isActive = (href: string) => p === href;
  const { strings } = useI18n();
  const auth = db.useAuth();
  const actionCount = useActionItemsCount(auth.user?.id);
  
  // Check if we're in PWA mode (preserve ?pwa=1 when navigating)
  const [isPwaMode, setIsPwaMode] = useState(false);
  
  useEffect(() => {
    // Check URL for ?pwa=1 parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasPwaParam = urlParams.get('pwa') === '1';
    
    // Check standalone mode
    const isInStandaloneMode = 
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;
    
    setIsPwaMode(hasPwaParam || isInStandaloneMode);
    
    // Listen for URL changes
    const handleLocationChange = () => {
      const newParams = new URLSearchParams(window.location.search);
      const newHasPwaParam = newParams.get('pwa') === '1';
      setIsPwaMode(newHasPwaParam || isInStandaloneMode);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);
  
  const pwaParam = isPwaMode ? '?pwa=1' : '';
  
  return (
    <nav 
      aria-label="Hoofd navigatie" 
      className="fixed inset-x-0 bottom-0 z-60 border-t bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85 pb-safe shadow-lg"
      style={{
        borderColor: 'rgba(15, 23, 42, 0.06)',
        boxShadow: '0 -4px 16px -2px rgba(15, 23, 42, 0.08), 0 -2px 8px -1px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-center justify-between py-1.5">
        <Link
          className={`relative flex flex-col items-center gap-1.5 p-2.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg ${
            isActive('/studio') 
              ? 'text-[color:var(--color-secondary)] scale-105' 
              : 'text-gray-600 hover:text-[color:var(--color-secondary)] hover:scale-105 active:scale-95'
          }`}
          href={`/studio${pwaParam}`}
        >
          {isActive('/studio') && (
            <div 
              className="absolute inset-0 rounded-lg opacity-10"
              style={{
                background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))',
              }}
            />
          )}
          <img 
            src="/icons/chat.svg" 
            alt="" 
            aria-hidden 
            className={`h-5 w-5 transition-transform duration-300 ${
              isActive('/studio') ? 'scale-110' : ''
            }`}
          />
          <span className="relative z-10">{strings.nav.chat}</span>
        </Link>
        <Link
          className={`relative flex flex-col items-center gap-1.5 p-2.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg ${
            isActive('/library') 
              ? 'text-[color:var(--color-secondary)] scale-105' 
              : 'text-gray-600 hover:text-[color:var(--color-secondary)] hover:scale-105 active:scale-95'
          }`}
          href="/library"
        >
          {actionCount > 0 && (
            <span 
              className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white animate-pulse z-20"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #f87171)',
                boxShadow: '0 2px 8px -1px rgba(239, 68, 68, 0.5)',
              }}
            >
              {actionCount > 9 ? '9+' : actionCount}
            </span>
          )}
          {isActive('/library') && (
            <div 
              className="absolute inset-0 rounded-lg opacity-10"
              style={{
                background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))',
              }}
            />
          )}
          <img 
            src="/icons/library.svg" 
            alt="" 
            aria-hidden 
            className={`h-5 w-5 transition-transform duration-300 ${
              isActive('/library') ? 'scale-110' : ''
            }`}
          />
          <span className="relative z-10">{strings.nav.library}</span>
        </Link>
        <Link
          className={`relative flex flex-col items-center gap-1.5 p-2.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg ${
            isActive('/settings') 
              ? 'text-[color:var(--color-secondary)] scale-105' 
              : 'text-gray-600 hover:text-[color:var(--color-secondary)] hover:scale-105 active:scale-95'
          }`}
          href="/settings"
        >
          {isActive('/settings') && (
            <div 
              className="absolute inset-0 rounded-lg opacity-10"
              style={{
                background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))',
              }}
            />
          )}
          <img 
            src="/icons/settings.svg" 
            alt="" 
            aria-hidden 
            className={`h-5 w-5 transition-transform duration-300 ${
              isActive('/settings') ? 'scale-110' : ''
            }`}
          />
          <span className="relative z-10">{strings.nav.settings}</span>
        </Link>
        <div className="flex items-center justify-center p-2.5">
          <LanguageToggle />
        </div>
      </div>
    </nav>
  );
}
