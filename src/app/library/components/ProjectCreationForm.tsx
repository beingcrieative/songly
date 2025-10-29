"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";

interface ProjectCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; icon: string; color: string }) => Promise<void>;
  suggestedNames?: string[];
  suggestedIcons?: string[];
  loading?: boolean;
}

const DEFAULT_ICONS = ["🎵", "🎸", "🎹", "🎤", "💕", "❤️", "🎼", "🎺", "🎻", "🥁"];
const DEFAULT_COLORS = ["rose", "amber", "emerald", "blue", "purple", "indigo", "cyan"];

/**
 * ProjectCreationForm Component
 * Form for creating new projects with auto-suggestions
 * Provides intuitive UI for project setup
 */
export function ProjectCreationForm({
  isOpen,
  onClose,
  onSubmit,
  suggestedNames = [],
  suggestedIcons = DEFAULT_ICONS,
  loading = false,
}: ProjectCreationFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(suggestedIcons[0] || "🎵");
  const [selectedColor, setSelectedColor] = useState("rose");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });

      // Reset form
      setName("");
      setDescription("");
      setSelectedIcon(suggestedIcons[0] || "🎵");
      setSelectedColor("rose");
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  if (!isOpen) return null;

  const colorInfo: Record<string, { name: string; bg: string; text: string }> = {
    rose: { name: "Rose", bg: "bg-rose-100", text: "text-rose-600" },
    amber: { name: "Amber", bg: "bg-amber-100", text: "text-amber-600" },
    emerald: { name: "Emerald", bg: "bg-emerald-100", text: "text-emerald-600" },
    blue: { name: "Blue", bg: "bg-blue-100", text: "text-blue-600" },
    purple: { name: "Purple", bg: "bg-purple-100", text: "text-purple-600" },
    indigo: { name: "Indigo", bg: "bg-indigo-100", text: "text-indigo-600" },
    cyan: { name: "Cyan", bg: "bg-cyan-100", text: "text-cyan-600" },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">New Project</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Love Songs"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />

            {/* Suggested names */}
            {suggestedNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedNames.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setName(suggestion)}
                    className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description input */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of songs for..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Icon selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {suggestedIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`rounded-lg border-2 py-2 text-2xl transition ${
                    selectedIcon === icon
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  disabled={loading}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {DEFAULT_COLORS.map((color) => {
                const info = colorInfo[color];
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-10 w-10 rounded-lg border-2 transition ${
                      selectedColor === color
                        ? `${info.bg} border-slate-800`
                        : `${info.bg} border-slate-200 hover:border-slate-300`
                    }`}
                    title={info.name}
                    disabled={loading}
                  />
                );
              })}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 border-t border-slate-200 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectCreationForm;
