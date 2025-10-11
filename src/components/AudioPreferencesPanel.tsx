'use client';

import { useState } from 'react';
import { VocalPreferences } from '@/types/conversation';

interface AudioPreferencesPanelProps {
  preferences: VocalPreferences;
  onChange: (prefs: VocalPreferences) => void;
  disabled?: boolean;
  /** Preferences that were AI-detected (vs user-selected) */
  aiDetectedPrefs?: {
    language?: boolean;
    vocalGender?: boolean;
    vocalAge?: boolean;
  };
  /** Whether the section should start collapsed */
  defaultCollapsed?: boolean;
}

export default function AudioPreferencesPanel({
  preferences,
  onChange,
  disabled = false,
  aiDetectedPrefs,
  defaultCollapsed = false,
}: AudioPreferencesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  // Language selector options
  const languages = ['Nederlands', 'English', 'Français', 'Español'];

  // Voice tone options
  const voiceTones = [
    { value: 'young', label: 'Young & Bright (20-30)' },
    { value: 'mature', label: 'Mature & Warm (30-40)' },
    { value: 'deep', label: 'Deep & Soulful (40+)' },
  ];

  const handleLanguageChange = (language: string) => {
    onChange({ ...preferences, language });
  };

  const handleGenderChange = (vocalGender: 'male' | 'female' | 'neutral') => {
    onChange({ ...preferences, vocalGender });
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vocalAge = e.target.value as 'young' | 'mature' | 'deep' | '';
    onChange({ ...preferences, vocalAge: vocalAge || undefined });
  };

  // Helper component for AI detected badge
  const AIDetectedBadge = () => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7f5af0]/10 text-[#7f5af0] text-xs font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
      </svg>
      AI Detected
    </span>
  );

  return (
    <div className="border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/30 transition-colors"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[rgba(31,27,45,0.8)]">
          Audio Preferences
        </h3>
        <svg
          className={`w-5 h-5 text-[rgba(31,27,45,0.5)] transition-transform ${
            isCollapsed ? '' : 'rotate-180'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* Language Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium uppercase tracking-wide text-[rgba(31,27,45,0.5)]">
            Language
          </label>
          {aiDetectedPrefs?.language && preferences.language && <AIDetectedBadge />}
        </div>
        <div className="flex gap-2 flex-wrap">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              disabled={disabled}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  preferences.language === lang
                    ? 'bg-[#7f5af0] text-white shadow-md'
                    : 'bg-white/80 text-[rgba(31,27,45,0.7)] hover:bg-[#7f5af0]/10 border border-white/60'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {lang}
            </button>
          ))}
        </div>
        {preferences.language && (
          <p className="text-xs text-[rgba(31,27,45,0.5)] mt-1">
            Selected: {preferences.language}
          </p>
        )}
      </div>

      {/* Voice Gender Toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium uppercase tracking-wide text-[rgba(31,27,45,0.5)]">
            Voice Gender
          </label>
          {aiDetectedPrefs?.vocalGender && preferences.vocalGender && preferences.vocalGender !== 'neutral' && <AIDetectedBadge />}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleGenderChange('male')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
              flex items-center justify-center gap-2
              ${
                preferences.vocalGender === 'male'
                  ? 'bg-[#7f5af0] text-white shadow-md'
                  : 'bg-white/80 text-[rgba(31,27,45,0.7)] hover:bg-[#7f5af0]/10 border border-white/60'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span>♂️</span>
            <span>Male</span>
          </button>
          <button
            onClick={() => handleGenderChange('female')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
              flex items-center justify-center gap-2
              ${
                preferences.vocalGender === 'female'
                  ? 'bg-[#7f5af0] text-white shadow-md'
                  : 'bg-white/80 text-[rgba(31,27,45,0.7)] hover:bg-[#7f5af0]/10 border border-white/60'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span>♀️</span>
            <span>Female</span>
          </button>
          <button
            onClick={() => handleGenderChange('neutral')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                preferences.vocalGender === 'neutral' || !preferences.vocalGender
                  ? 'bg-[#7f5af0] text-white shadow-md'
                  : 'bg-white/80 text-[rgba(31,27,45,0.7)] hover:bg-[#7f5af0]/10 border border-white/60'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            Auto
          </button>
        </div>
      </div>

      {/* Voice Tone Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="voice-tone"
            className="text-sm font-medium uppercase tracking-wide text-[rgba(31,27,45,0.5)]"
          >
            Voice Tone
          </label>
          {aiDetectedPrefs?.vocalAge && preferences.vocalAge && <AIDetectedBadge />}
        </div>
        <select
          id="voice-tone"
          value={preferences.vocalAge || ''}
          onChange={handleAgeChange}
          disabled={disabled}
          className={`
            w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm
            outline-none focus:border-[#7f5af0] focus:ring-2 focus:ring-[#7f5af0]/20
            transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <option value="">Select tone (optional)</option>
          {voiceTones.map((tone) => (
            <option key={tone.value} value={tone.value}>
              {tone.label}
            </option>
          ))}
        </select>
      </div>
        </div>
      )}
    </div>
  );
}
