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
    <div className="w-full">
      <div className="flex items-center gap-2">
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
            className="w-full h-12 rounded-xl border-2 pl-4 pr-12 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:bg-gray-100"
            style={{ borderColor: 'rgba(74, 222, 128, 0.35)' }}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-700"
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
          className="h-12 w-12 flex items-center justify-center rounded-xl text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
          style={{ backgroundImage: disabled || !value.trim() ? undefined : 'var(--gradient-primary)' }}
          aria-label="Verstuur"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="translate-x-[1px]">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
