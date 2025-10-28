"use client";

import React, { useRef, useEffect } from "react";

export interface ComposerBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ComposerBar({ value, onChange, onSubmit, disabled, placeholder }: ComposerBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (disabled) return;

    // Store the current focus state
    const wasFocused = document.activeElement === inputRef.current;

    onSubmit();

    // Keep keyboard open on mobile by refocusing the input
    // Use multiple attempts to ensure focus is restored
    if (wasFocused) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();

        // Double-check after a short delay
        setTimeout(() => {
          if (document.activeElement !== inputRef.current) {
            inputRef.current?.focus();
          }
        }, 50);
      });
    }
  };

  // Auto-scroll input into view when keyboard opens
  const handleFocus = () => {
    // Small delay to ensure keyboard is shown before scrolling
    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }, 300);
  };

  return (
    <div className="w-full border-t border-gray-200 bg-white">
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <input
            type="text"
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            onFocus={handleFocus}
            onBlur={() => {
              // No-op: user controls keyboard visibility; avoid auto-clearing state
            }}
            enterKeyHint="send"
            placeholder={placeholder}
            disabled={disabled}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="h-10 w-full rounded-lg border border-gray-300 pl-3 pr-10 text-sm shadow-sm focus:outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] disabled:bg-gray-50"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-700"
            aria-label="Toetsenbord verbergen"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.blur()}
          >
            {/* keyboard-hide icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4 4h16v10H4zM6 6h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zM6 9h12v1H6zm6 7l-3 3h6z" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-all hover:shadow-md active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
          style={{ backgroundImage: disabled || !value.trim() ? undefined : 'var(--gradient-primary)' }}
          aria-label="Verstuur"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
