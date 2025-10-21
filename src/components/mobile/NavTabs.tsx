"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageToggle from '@/components/LanguageToggle';
import { useI18n } from '@/providers/I18nProvider';

export default function NavTabs() {
  const p = usePathname();
  const isActive = (href: string) => p === href;
  const { strings } = useI18n();
  return (
    <nav aria-label="Hoofd navigatie" className="fixed inset-x-0 bottom-0 z-60 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 pb-safe">
      <div className="mx-auto grid max-w-md grid-cols-4 items-center justify-between py-1">
        <Link
          className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            isActive('/studio') ? 'text-[color:var(--color-secondary)]' : 'text-gray-600 hover:text-[color:var(--color-secondary)]'
          }`}
          href="/studio"
        >
          <img src="/icons/chat.svg" alt="" aria-hidden className="h-5 w-5" />
          <span>{strings.nav.chat}</span>
        </Link>
        <Link
          className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            isActive('/library') ? 'text-[color:var(--color-secondary)]' : 'text-gray-600 hover:text-[color:var(--color-secondary)]'
          }`}
          href="/library"
        >
          <img src="/icons/library.svg" alt="" aria-hidden className="h-5 w-5" />
          <span>{strings.nav.library}</span>
        </Link>
        <Link
          className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            isActive('/settings') ? 'text-[color:var(--color-secondary)]' : 'text-gray-600 hover:text-[color:var(--color-secondary)]'
          }`}
          href="/settings"
        >
          <img src="/icons/settings.svg" alt="" aria-hidden className="h-5 w-5" />
          <span>{strings.nav.settings}</span>
        </Link>
        <div className="flex items-center justify-center">
          <LanguageToggle />
        </div>
      </div>
    </nav>
  );
}
