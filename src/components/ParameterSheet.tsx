"use client";

import React, { useEffect, useId, useMemo, useState } from "react";

type VocalGender = "male" | "female" | "neutral";
type VocalAge = "young" | "mature" | "deep";

export interface ParameterValues {
  language: string;
  vocalGender: VocalGender;
  vocalAge?: VocalAge;
}

interface ParameterSheetProps {
  isOpen: boolean;
  defaults: ParameterValues;
  languages?: string[];
  onClose: () => void;
  onConfirm: (values: ParameterValues) => void;
  isSubmitting?: boolean;
}

const DEFAULT_LANGUAGES = ["Nederlands", "English", "Deutsch", "Français", "Español"];

export function ParameterSheet({
  isOpen,
  defaults,
  languages = DEFAULT_LANGUAGES,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ParameterSheetProps) {
  const [language, setLanguage] = useState(defaults.language || languages[0]);
  const [vocalGender, setVocalGender] = useState<VocalGender>(defaults.vocalGender || "neutral");
  const [vocalAge, setVocalAge] = useState<VocalAge | undefined>(defaults.vocalAge);

  const headingId = useId();
  const descriptionId = useId();

  const genderOptions = useMemo(
    () => [
      { value: "female" as const, label: "Vrouw" },
      { value: "male" as const, label: "Man" },
      { value: "neutral" as const, label: "Neutraal" },
    ],
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setLanguage(defaults.language || languages[0]);
    setVocalGender(defaults.vocalGender || "neutral");
    setVocalAge(defaults.vocalAge);
  }, [defaults.language, defaults.vocalGender, defaults.vocalAge, languages]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSheetClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const isValid = Boolean(language.trim() && vocalGender);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    onConfirm({ language, vocalGender, vocalAge });
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 md:items-center md:py-12"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl transition-transform md:rounded-2xl"
        onClick={handleSheetClick}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={headingId} className="text-lg font-semibold text-gray-900">
                Stembeleving instellen
              </h2>
              <p id={descriptionId} className="mt-1 text-sm text-gray-500">
                Kies de voorkeuren voordat we de muziek genereren.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Parameter sheet sluiten"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Taal</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-gray-700">Stem</legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {genderOptions.map(({ value, label }) => {
                  const isActive = vocalGender === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setVocalGender(value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
                        isActive
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-pink-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Vocale leeftijd / toon</span>
              <select
                value={vocalAge || ""}
                onChange={(event) =>
                  setVocalAge(event.target.value ? (event.target.value as VocalAge) : undefined)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="">Geen voorkeur</option>
                <option value="young">Jong / sprankelend</option>
                <option value="mature">Volwassen / warm</option>
                <option value="deep">Diep / soulful</option>
              </select>
            </label>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Bevestigen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ParameterSheet;
