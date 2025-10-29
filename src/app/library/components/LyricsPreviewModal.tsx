"use client";

import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

interface LyricsPreviewModalProps {
  isOpen: boolean;
  title: string;
  lyrics: string;
  onClose: () => void;
  onEdit?: () => void;
  onSelect?: () => void;
  showActions?: boolean;
}

/**
 * LyricsPreviewModal Component
 * Quick preview modal for viewing song lyrics
 * Supports copying and selection actions
 */
export function LyricsPreviewModal({
  isOpen,
  title,
  lyrics,
  onClose,
  onEdit,
  onSelect,
  showActions = true,
}: LyricsPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy lyrics:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Song lyrics preview
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100 transition"
            title="Close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Lyrics content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
              {lyrics}
            </pre>
          </div>
        </div>

        {/* Footer actions */}
        {showActions && (
          <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>

            {onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Edit
              </button>
            )}

            {onSelect && (
              <button
                onClick={onSelect}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Select
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LyricsPreviewModal;
