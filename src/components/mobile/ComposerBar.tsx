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

  const isSubmitEnabled = !disabled && value.trim().length > 0;

  return (
    <div 
      className="w-full border-t bg-white/98 backdrop-blur-sm"
      style={{
        borderColor: 'rgba(15, 23, 42, 0.08)',
      }}
    >
      <div className="flex items-center gap-3 p-4">
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
            className="h-12 w-full rounded-2xl border-2 pl-4 pr-12 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-0 disabled:bg-gray-50 disabled:cursor-not-allowed"
            style={{
              borderColor: 'rgba(15, 23, 42, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
            }}
            onFocus={(e) => {
              handleFocus();
              e.currentTarget.style.borderColor = 'var(--color-secondary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(32, 178, 170, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors duration-200 hover:text-gray-600 active:text-gray-700 rounded-r-2xl"
            aria-label="Toetsenbord verbergen"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.blur()}
          >
            {/* keyboard-hide icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4 4h16v10H4zM6 6h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zM6 9h12v1H6zm6 7l-3 3h6z" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSubmit}
          disabled={!isSubmitEnabled}
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-all duration-300 ${
            isSubmitEnabled 
              ? 'hover:shadow-xl hover:scale-105 active:scale-95' 
              : 'bg-gray-300 cursor-not-allowed opacity-50'
          }`}
          style={isSubmitEnabled ? {
            backgroundImage: 'var(--gradient-primary)',
            boxShadow: '0 8px 24px -4px rgba(32, 178, 170, 0.4), 0 4px 8px -2px rgba(74, 222, 128, 0.3)',
          } : {}}
          aria-label="Verstuur"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            aria-hidden
            className={isSubmitEnabled ? 'transition-transform duration-300' : ''}
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
