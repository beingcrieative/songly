'use client';

import { useI18n } from '@/providers/I18nProvider';

type LanguageToggleProps = {
  className?: string;
};

export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { language, setLanguage, strings } = useI18n();
  const isDutch = language === 'nl';

  const toggle = () => {
    setLanguage(isDutch ? 'en' : 'nl');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
        className || ''
      }`}
      style={{ borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a', background: 'rgba(255,255,255,0.8)' }}
      aria-label={isDutch ? strings.languageToggle.switchToEnglish : strings.languageToggle.switchToDutch}
    >
      <span className={`rounded-full px-2 py-0.5 ${isDutch ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500'}`}>NL</span>
      <span className={`rounded-full px-2 py-0.5 ${!isDutch ? 'bg-[var(--color-secondary)] text-white' : 'text-gray-500'}`}>EN</span>
    </button>
  );
}
