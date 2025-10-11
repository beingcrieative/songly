"use client";

import { useEffect, useState } from "react";
import { TemplateCard } from "./TemplateCard";
import { MUSIC_TEMPLATES, SURPRISE_ME_TEMPLATE } from "@/templates/music-templates";
import { AdvancedControlsPanel, AdvancedSettings } from "./AdvancedControlsPanel";

/**
 * TemplateSelector Component
 *
 * Parent component that displays all music templates and handles selection.
 * Part of Task 2.0: Build Template Selector UI Component
 */

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
  advancedSettings?: AdvancedSettings;
  onAdvancedSettingsChange?: (next: AdvancedSettings) => void;
  onResetAdvancedSettings?: () => void;
  disableAdvancedControls?: boolean;
}

export function TemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
  advancedSettings,
  onAdvancedSettingsChange,
  onResetAdvancedSettings,
  disableAdvancedControls = false,
}: TemplateSelectorProps) {
  // Task 2.6: Map all templates to TemplateCard components
  const allTemplates = [...MUSIC_TEMPLATES, SURPRISE_ME_TEMPLATE];
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(Boolean(advancedSettings?.enabled));

  useEffect(() => {
    if (advancedSettings?.enabled) {
      setIsAdvancedOpen(true);
    }
  }, [advancedSettings?.enabled]);

  // Task 2.8: Template selection handler
  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <h2 className="text-lg font-bold text-gray-800">🎵 Kies je Stijl</h2>
        <p className="text-sm text-gray-600 mt-1">
          Selecteer een template of laat Suno verrassen
        </p>
      </div>

      {/* Task 2.9: Responsive layout - stack on mobile, grid on desktop */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {/* Task 2.6: Regular templates */}
          {MUSIC_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={handleTemplateSelect}
            />
          ))}

          {/* Task 2.7: "Verras Me" card with special styling */}
          <div className="pt-2">
            <div className="relative">
              {/* Sparkle decoration */}
              <div className="absolute -top-1 -left-1 text-2xl animate-pulse">✨</div>
              <div className="absolute -top-1 -right-1 text-2xl animate-pulse" style={{ animationDelay: '0.3s' }}>✨</div>

              <TemplateCard
                template={SURPRISE_ME_TEMPLATE}
                isSelected={selectedTemplateId === SURPRISE_ME_TEMPLATE.id}
                onSelect={handleTemplateSelect}
              />
            </div>
          </div>
        </div>

        {/* Helper text */}
        {!selectedTemplateId && (
          <div className="mt-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <p className="text-sm text-pink-800">
              💡 <strong>Tip:</strong> Luister naar de voorbeelden om te horen hoe je liedje gaat klinken!
            </p>
          </div>
        )}
      </div>

      {/* Task 2.10: Footer with selected template info */}
      {selectedTemplateId && (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-pink-500"></div>
            <span className="text-gray-700">
              Geselecteerd: <strong>
                {allTemplates.find(t => t.id === selectedTemplateId)?.name}
              </strong>
            </span>
          </div>
        </div>
      )}

      {advancedSettings && onAdvancedSettingsChange && (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            disabled={disableAdvancedControls || !selectedTemplateId}
            aria-expanded={isAdvancedOpen}
            className="flex w-full items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>Geavanceerde Opties</span>
            <svg
              className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 8l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isAdvancedOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isAdvancedOpen}
          >
            <div className={`pt-4 transition-transform duration-300 ${isAdvancedOpen ? "translate-y-0" : "-translate-y-2"}`}>
              <AdvancedControlsPanel
                settings={advancedSettings}
                onChange={onAdvancedSettingsChange}
                onResetToTemplate={onResetAdvancedSettings}
                disabled={disableAdvancedControls || !selectedTemplateId}
                className="bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
