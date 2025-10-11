"use client";

import { useState } from "react";
import { TemplateCard } from "./TemplateCard";
import { MUSIC_TEMPLATES, SURPRISE_ME_TEMPLATE, MusicTemplate } from "@/templates/music-templates";

/**
 * TemplateSelector Component
 *
 * Parent component that displays all music templates and handles selection.
 * Part of Task 2.0: Build Template Selector UI Component
 */

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
}

export function TemplateSelector({ selectedTemplateId, onTemplateSelect }: TemplateSelectorProps) {
  // Task 2.6: Map all templates to TemplateCard components
  const allTemplates = [...MUSIC_TEMPLATES, SURPRISE_ME_TEMPLATE];

  // Task 2.8: Template selection handler
  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
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
    </div>
  );
}
