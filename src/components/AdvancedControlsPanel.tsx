"use client";

import React from "react";
import { SunoConfig } from "@/templates/music-templates";

export interface AdvancedSettings {
  enabled: boolean;
  model: SunoConfig["model"];
  vocalGender: "male" | "female" | "neutral";
  styleWeight: number;
  weirdnessConstraint: number;
  audioWeight: number;
  negativeTags: string;
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  enabled: false,
  model: "V5",
  vocalGender: "neutral",
  styleWeight: 0.8,
  weirdnessConstraint: 0.4,
  audioWeight: 0.5,
  negativeTags: "",
};

interface AdvancedControlsPanelProps {
  settings: AdvancedSettings;
  onChange: (next: AdvancedSettings) => void;
  disabled?: boolean;
  className?: string;
  onResetToTemplate?: () => void;
}

export function AdvancedControlsPanel({
  settings,
  onChange,
  disabled = false,
  className = "",
  onResetToTemplate,
}: AdvancedControlsPanelProps) {
  const toggleEnabled = () => {
    if (disabled) return;
    onChange({ ...settings, enabled: !settings.enabled });
  };

  const updateVocalGender = (next: AdvancedSettings["vocalGender"]) => {
    if (disabled || !settings.enabled) return;
    onChange({ ...settings, vocalGender: next });
  };

  const updateStyleWeight = (next: number) => {
    if (disabled || !settings.enabled) return;
    onChange({ ...settings, styleWeight: next });
  };

  const updateWeirdness = (next: number) => {
    if (disabled || !settings.enabled) return;
    onChange({ ...settings, weirdnessConstraint: next });
  };

  const updateAudioWeight = (next: number) => {
    if (disabled || !settings.enabled) return;
    onChange({ ...settings, audioWeight: next });
  };

  const updateModel = (next: AdvancedSettings["model"]) => {
    if (disabled || !settings.enabled) return;
    onChange({ ...settings, model: next });
  };

  const updateNegativeTags = (next: string) => {
    if (disabled || !settings.enabled) return;
    onChange({ ...settings, negativeTags: next });
  };

  const handleReset = () => {
    if (disabled) return;
    if (onResetToTemplate) {
      onResetToTemplate();
    } else {
      onChange({
        ...DEFAULT_ADVANCED_SETTINGS,
        enabled: settings.enabled,
      });
    }
  };

  return (
    <section
      className={`rounded-xl border ${
        settings.enabled ? "border-purple-200 bg-white/95" : "border-gray-200 bg-white/70"
      } p-4 shadow-sm transition-colors ${className}`}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-purple-700">Geavanceerde Opties</h2>
          <p className="text-xs text-gray-500">
            Fijn-afstelling voor Suno parameters zoals model, stijl en creativiteit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            aria-disabled={disabled}
            onClick={toggleEnabled}
            disabled={disabled}
            title="Schakel geavanceerde instellingen in of uit."
            className={`flex items-center gap-2 rounded-full border px-1 py-0.5 text-xs font-medium transition-colors ${
              settings.enabled
                ? "border-purple-400 bg-purple-100 text-purple-700"
                : "border-gray-300 bg-white text-gray-500"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <span
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                settings.enabled ? "bg-purple-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings.enabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </span>
            <span>{settings.enabled ? "Aan" : "Uit"}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || !settings.enabled}
            className="rounded-full border border-purple-300 px-3 py-1 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset naar template
          </button>
        </div>
      </header>

      <div
        className={`mt-4 rounded-lg border border-dashed px-3 py-2 text-xs ${
          settings.enabled
            ? "border-purple-200 bg-purple-50/60 text-purple-700"
            : "border-gray-200 bg-gray-50 text-gray-500"
        }`}
        title="Geavanceerde parameters verschijnen zodra de bijbehorende stappen voltooid zijn."
      >
        Verdere bedieningselementen worden in de volgende stappen toegevoegd.
      </div>

      <dl
        className={`mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 ${
          settings.enabled ? "text-gray-600" : "text-gray-400"
        }`}
      >
        <div className="rounded-lg bg-white/70 px-3 py-2 shadow-inner">
          <dt
            className={`font-semibold ${
              settings.enabled ? "text-gray-700" : "text-gray-500"
            }`}
          >
            Suno model
          </dt>
          <dd className={`mt-1 ${settings.enabled ? "text-gray-500" : "text-gray-400"}`}>
            {settings.model}
          </dd>
        </div>
        <div className="rounded-lg bg-white/70 px-3 py-2 shadow-inner">
          <dt
            className={`font-semibold ${
              settings.enabled ? "text-gray-700" : "text-gray-500"
            }`}
          >
            Creativiteit
          </dt>
          <dd className={`mt-1 ${settings.enabled ? "text-gray-500" : "text-gray-400"}`}>
            Weirdness {Math.round(settings.weirdnessConstraint * 100)}%
          </dd>
        </div>
      </dl>

      <div
        className={`mt-4 rounded-lg border px-3 py-3 ${
          settings.enabled ? "border-purple-200 bg-white" : "border-gray-200 bg-gray-50"
        }`}
        title="Kies een voorkeur voor de zangstem."
      >
        <label className="block text-xs font-semibold text-gray-600">
          Vocal Gender <span className="font-normal text-gray-400">(m / f / neutraal)</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Kies een voorkeur voor de zangstem wanneer geavanceerde opties actief zijn.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            { key: "male", label: "Man" },
            { key: "female", label: "Vrouw" },
            { key: "neutral", label: "Neutraal" },
          ] as const).map(({ key, label }) => {
            const active = settings.vocalGender === key;
            const isDisabled = disabled || !settings.enabled;
            return (
              <button
                key={key}
                type="button"
                onClick={() => updateVocalGender(key)}
                disabled={isDisabled}
                aria-pressed={active}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-purple-600 text-white shadow"
                    : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-3 ${
          settings.enabled ? "border-purple-200 bg-white" : "border-gray-200 bg-gray-50"
        }`}
        title="Selecteer de Suno modelversie voor het genereren van muziek."
      >
        <label className="block text-xs font-semibold text-gray-600">
          Suno Model <span className="font-normal text-gray-400">(V4, V4_5, V4_5PLUS, V5)</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Kies de modelversie voor muziek generatie. Nieuwere modellen leveren meestal rijkere audio.
        </p>
        <select
          value={settings.model}
          onChange={(event) => updateModel(event.target.value as AdvancedSettings["model"])}
          disabled={disabled || !settings.enabled}
          className="mt-3 w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          {(["V4", "V4_5", "V4_5PLUS", "V5"] as const).map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-3 ${
          settings.enabled ? "border-purple-200 bg-white" : "border-gray-200 bg-gray-50"
        }`}
        title="Bepaalt hoe strak je de gekozen stijl wil volgen."
      >
        <label className="block text-xs font-semibold text-gray-600">
          Style Weight <span className="font-normal text-gray-400">(0 - 100%)</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Bepaalt hoe sterk Suno zich aan de gekozen stijl houdt. Hoger = meer volgens template.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(settings.styleWeight * 100)}
            onChange={(event) => updateStyleWeight(Number(event.target.value) / 100)}
            disabled={disabled || !settings.enabled}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-purple-200 via-purple-300 to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="w-12 text-right text-xs font-semibold text-purple-700">
            {Math.round(settings.styleWeight * 100)}%
          </span>
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-3 ${
          settings.enabled ? "border-purple-200 bg-white" : "border-gray-200 bg-gray-50"
        }`}
        title="Stel in hoe creatief of experimenteel de output mag zijn."
      >
        <label className="block text-xs font-semibold text-gray-600">
          Weirdness Constraint <span className="font-normal text-gray-400">(0 - 100%)</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Controleert hoe experimenteel de output mag zijn. Lager = veiliger en voorspelbaarder.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(settings.weirdnessConstraint * 100)}
            onChange={(event) => updateWeirdness(Number(event.target.value) / 100)}
            disabled={disabled || !settings.enabled}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-purple-200 via-purple-300 to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="w-12 text-right text-xs font-semibold text-purple-700">
            {Math.round(settings.weirdnessConstraint * 100)}%
          </span>
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-3 ${
          settings.enabled ? "border-purple-200 bg-white" : "border-gray-200 bg-gray-50"
        }`}
        title="Balans tussen vocale prestaties en instrumentale kwaliteit."
      >
        <label className="block text-xs font-semibold text-gray-600">
          Audio Weight <span className="font-normal text-gray-400">(0 - 100%)</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Balanceert focus tussen vocale prestaties en instrumentale kwaliteit. Hoger = meer audio detail.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(settings.audioWeight * 100)}
            onChange={(event) => updateAudioWeight(Number(event.target.value) / 100)}
            disabled={disabled || !settings.enabled}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-purple-200 via-purple-300 to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="w-12 text-right text-xs font-semibold text-purple-700">
            {Math.round(settings.audioWeight * 100)}%
          </span>
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-3 ${
          settings.enabled ? "border-purple-200 bg-white" : "border-gray-200 bg-gray-50"
        }`}
        title="Som onderdelen op die Suno moet vermijden in de productie."
      >
        <label className="block text-xs font-semibold text-gray-600">
          Negative Tags <span className="font-normal text-gray-400">(komma-gescheiden)</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Geef elementen op die Suno moet vermijden (bijv. &quot;rap, distorted vocals&quot;).
        </p>
        <textarea
          value={settings.negativeTags}
          onChange={(event) => updateNegativeTags(event.target.value)}
          disabled={disabled || !settings.enabled}
          rows={3}
          className="mt-3 w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-inner placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          placeholder="Voorbeelden: rap, distortion, autotune"
        />
      </div>
    </section>
  );
}

export default AdvancedControlsPanel;
