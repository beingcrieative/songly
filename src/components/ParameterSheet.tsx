"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useI18n } from '@/providers/I18nProvider';

type VocalGender = "male" | "female" | "neutral";
type VocalAge = "young" | "mature" | "deep";

export interface ParameterValues {
  language: string;
  vocalGender: VocalGender;
  vocalAge?: VocalAge;
}

export interface ParameterSheetExtras {
  title: string;
  selectedTemplateId: string | null;
  instrumental: boolean;
  styleWeight: number;
  weirdnessConstraint: number;
  audioWeight: number;
}

export interface ParameterSheetTemplate {
  id: string;
  name: string;
  imageUrl?: string;
  icon?: string;
}

interface ParameterSheetProps {
  isOpen: boolean;
  defaults: ParameterValues;
  extras: ParameterSheetExtras;
  templates: ParameterSheetTemplate[];
  languages?: string[];
  onClose: () => void;
  onConfirm: (values: ParameterValues, extras: ParameterSheetExtras) => void;
  isSubmitting?: boolean;
}

const DEFAULT_LANGUAGES = ["Nederlands", "English", "Deutsch", "Français", "Español"];

export function ParameterSheet({
  isOpen,
  defaults,
  extras,
  templates,
  languages = DEFAULT_LANGUAGES,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ParameterSheetProps) {
  const [language, setLanguage] = useState(defaults.language || languages[0]);
  const [vocalGender, setVocalGender] = useState<VocalGender>(defaults.vocalGender || "neutral");
  const [vocalAge, setVocalAge] = useState<VocalAge | undefined>(defaults.vocalAge);

  const [title, setTitle] = useState<string>(extras.title || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(extras.selectedTemplateId);
  const [instrumental, setInstrumental] = useState<boolean>(extras.instrumental || false);
  const [styleWeight, setStyleWeight] = useState<number>(extras.styleWeight ?? 0.5);
  const [weirdness, setWeirdness] = useState<number>(extras.weirdnessConstraint ?? 0.2);
  const [audioWeight, setAudioWeight] = useState<number>(extras.audioWeight ?? 0.6);

  const titleRef = useRef<HTMLInputElement>(null);
  const { strings } = useI18n();

  const headingId = useId();
  const descriptionId = useId();

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

  useEffect(() => {
    setTitle(extras.title || "");
    setSelectedTemplateId(extras.selectedTemplateId ?? templates[0]?.id ?? null);
    setInstrumental(extras.instrumental || false);
    setStyleWeight(extras.styleWeight ?? 0.5);
    setWeirdness(extras.weirdnessConstraint ?? 0.2);
    setAudioWeight(extras.audioWeight ?? 0.6);
  }, [extras, templates]);

  useEffect(() => {
    if (isOpen && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isOpen]);

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
    const extrasPayload: ParameterSheetExtras = {
      title: title.trim(),
      selectedTemplateId,
      instrumental,
      styleWeight,
      weirdnessConstraint: weirdness,
      audioWeight,
    };
    onConfirm({ language, vocalGender, vocalAge }, extrasPayload);
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
        className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl transition-transform md:max-h-[min(90vh,720px)] md:rounded-2xl"
        onClick={handleSheetClick}
      >
        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-24 md:max-h-[min(90vh,720px)] md:overflow-y-auto">
          <div className="flex items-start justify-center py-2">
            <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: 'rgba(32,178,170,0.4)' }} />
          </div>
          <h2
            id={headingId}
            className="pt-2 pb-1 text-2xl font-extrabold leading-tight"
            style={{ color: 'var(--color-secondary)' }}
          >
            {strings.parameters.heading}
          </h2>
          <p id={descriptionId} className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {strings.parameters.description}
          </p>

          <div className="mt-6 space-y-8">
            {/* Title */}
            <div>
              <label htmlFor="param-title" className="mb-2 block text-sm font-medium" style={{ color: '#374151' }}>
                {strings.parameters.titleLabel}
              </label>
              <input
                id="param-title"
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={strings.parameters.titlePlaceholder}
                className="form-input w-full rounded-xl border-2 bg-white px-4 py-3 shadow-sm"
                style={{ borderColor: 'rgba(74, 222, 128, 0.4)', color: '#1f2937' }}
              />
            </div>

            {/* Template carousel */}
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: '#374151' }}>
                {strings.parameters.templateHeading}
              </h3>
              <div className="-mx-6 flex gap-5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {templates.map((template) => {
                  const active = template.id === selectedTemplateId;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      className="flex w-40 shrink-0 flex-col gap-2 transform transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <div
                        className={`relative aspect-square w-full rounded-2xl shadow-md ${active ? 'ring-4 ring-[var(--color-secondary)] p-1' : ''}`}
                        style={{
                          backgroundImage: template.imageUrl
                            ? `url(${template.imageUrl})`
                            : 'radial-gradient(circle at 30% 30%, rgba(32,178,170,0.25), rgba(255,255,255,0.2))',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {template.icon ? (
                          <span className="absolute left-2 top-2 text-xl" aria-hidden>
                            {template.icon}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`text-center text-base font-medium ${
                          active ? 'text-[color:var(--color-ink)] font-semibold' : 'text-gray-600'
                        }`}
                      >
                        {template.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instrumental */}
            <div className="flex items-center justify-between py-2">
              <span className="text-lg font-bold" style={{ color: '#111827' }}>
                {strings.parameters.instrumentalLabel}
              </span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={instrumental}
                  onChange={(e) => setInstrumental(e.target.checked)}
                  aria-label={strings.parameters.instrumentalLabel}
                />
                <div className="h-7 w-12 rounded-full bg-gray-300 shadow-inner peer-focus:outline-none peer-checked:bg-[var(--color-secondary)] after:absolute after:left-[4px] after:top-[3.5px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>

            {/* Voice */}
            <div>
              <h3 className="mb-4 text-lg font-bold" style={{ color: '#111827' }}>
                {strings.parameters.voiceHeading}
              </h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="language" className="mb-2 block text-sm font-medium" style={{ color: '#374151' }}>
                    {strings.parameters.languageLabel}
                  </label>
                  <select
                    id="language"
                    className="form-select w-full rounded-xl border-2 bg-white px-4 py-3 shadow-sm"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ borderColor: 'rgba(74, 222, 128, 0.4)' }}
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="gender" className="mb-2 block text-sm font-medium" style={{ color: '#374151' }}>
                    {strings.parameters.vocalGenderLabel}
                  </label>
                  <select
                    id="gender"
                    className="form-select w-full rounded-xl border-2 bg-white px-4 py-3 shadow-sm"
                    value={vocalGender}
                    onChange={(e) => setVocalGender(e.target.value as VocalGender)}
                    style={{ borderColor: 'rgba(74, 222, 128, 0.4)' }}
                  >
                    <option value="female">{strings.parameters.vocalGenderOptions.female}</option>
                    <option value="male">{strings.parameters.vocalGenderOptions.male}</option>
                    <option value="neutral">{strings.parameters.vocalGenderOptions.neutral}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="timbre" className="mb-2 block text-sm font-medium" style={{ color: '#374151' }}>
                    {strings.parameters.vocalAgeLabel}
                  </label>
                  <select
                    id="timbre"
                    className="form-select w-full rounded-xl border-2 bg-white px-4 py-3 shadow-sm"
                    value={vocalAge || ''}
                    onChange={(e) => setVocalAge(e.target.value ? (e.target.value as VocalAge) : undefined)}
                    style={{ borderColor: 'rgba(74, 222, 128, 0.4)' }}
                  >
                    <option value="">{strings.parameters.vocalAgeOptions.none}</option>
                    <option value="young">{strings.parameters.vocalAgeOptions.young}</option>
                    <option value="mature">{strings.parameters.vocalAgeOptions.mature}</option>
                    <option value="deep">{strings.parameters.vocalAgeOptions.deep}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div>
              <h3 className="mb-4 text-lg font-bold" style={{ color: '#111827' }}>
                {strings.parameters.advancedHeading}
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="style-weight" className="text-sm font-medium" style={{ color: '#374151' }}>
                      {strings.parameters.styleWeight}
                    </label>
                    <span className="text-base font-semibold" style={{ color: '#111827' }}>{styleWeight.toFixed(1)}</span>
                  </div>
                  <input
                    id="style-weight"
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={styleWeight}
                    onChange={(e) => setStyleWeight(parseFloat(e.target.value))}
                    className="h-2.5 w-full cursor-pointer rounded-full bg-[rgba(74,222,128,0.3)]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="weirdness" className="text-sm font-medium" style={{ color: '#374151' }}>
                      {strings.parameters.weirdnessConstraint}
                    </label>
                    <span className="text-base font-semibold" style={{ color: '#111827' }}>{weirdness.toFixed(1)}</span>
                  </div>
                  <input
                    id="weirdness"
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={weirdness}
                    onChange={(e) => setWeirdness(parseFloat(e.target.value))}
                    className="h-2.5 w-full cursor-pointer rounded-full bg-[rgba(74,222,128,0.3)]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="audio-weight" className="text-sm font-medium" style={{ color: '#374151' }}>
                      {strings.parameters.audioWeight}
                    </label>
                    <span className="text-base font-semibold" style={{ color: '#111827' }}>{audioWeight.toFixed(1)}</span>
                  </div>
                  <input
                    id="audio-weight"
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={audioWeight}
                    onChange={(e) => setAudioWeight(parseFloat(e.target.value))}
                    className="h-2.5 w-full cursor-pointer rounded-full bg-[rgba(74,222,128,0.3)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <div className="pointer-events-auto rounded-2xl border bg-white/90 p-3 shadow-lg" style={{ borderColor: 'rgba(15,23,42,0.12)' }}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-1/3 rounded-full border px-4 py-3 font-semibold"
                  style={{ borderColor: 'rgba(15,23,42,0.12)', color: '#374151' }}
                >
                  {strings.parameters.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="w-2/3 rounded-full px-4 py-3 font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundImage: 'var(--gradient-primary)' }}
                >
                  {strings.parameters.confirm}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ParameterSheet;
