"use client";

import React from "react";
import { UserPreferences } from "@/types/conversation";

interface SongSettingsPanelProps {
  preferences: UserPreferences;
  onChange: (next: UserPreferences) => void;
  disabled?: boolean;
  className?: string;
}

const LANGUAGES = ["Nederlands", "English", "Deutsch", "Français", "Español"];
const MOODS = ["romantisch", "upbeat", "melancholisch", "nostalgisch", "intiem"];

export function SongSettingsPanel({
  preferences,
  onChange,
  disabled = false,
  className = "",
}: SongSettingsPanelProps) {
  const toggleMood = (m: string) => {
    const current = preferences.mood || [];
    const exists = current.includes(m);
    const next = exists ? current.filter((x) => x !== m) : [...current, m];
    onChange({ ...preferences, mood: next });
  };

  return (
    <div className={`rounded-xl border border-pink-200 bg-white/90 p-4 shadow-sm ${className}`}>
      <div className="mb-3 text-sm font-semibold text-pink-700">Song Settings</div>

      {/* Language */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-600">Taal</label>
        <select
          value={preferences.language || "Nederlands"}
          onChange={(e) => onChange({ ...preferences, language: e.target.value })}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-100"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Vocal Gender */}
      <div className="mb-3">
        <div className="mb-1 text-xs font-medium text-gray-600">Stem</div>
        <div className="flex gap-2">
          {([
            { key: "female", label: "Vrouw" },
            { key: "male", label: "Man" },
            { key: "neutral", label: "Neutraal" },
          ] as const).map(({ key, label }) => {
            const active = preferences.vocalGender === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ ...preferences, vocalGender: key })}
                disabled={disabled}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  active
                    ? "bg-pink-600 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood */}
      <div>
        <div className="mb-1 text-xs font-medium text-gray-600">Sfeer</div>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const active = (preferences.mood || []).includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMood(m)}
                disabled={disabled}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-purple-100 text-purple-700 border border-purple-300"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SongSettingsPanel;

