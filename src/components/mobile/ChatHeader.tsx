"use client";

import React from "react";

export default function ChatHeader({ title, onNew }: { title: string; onNew?: () => void }) {
  return (
    <div className="sticky top-0 z-30 border-b border-[rgba(15,23,42,0.08)] bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 pt-safe">
      <div className="mx-auto grid max-w-3xl grid-cols-[40px_1fr_40px] items-center px-4 py-3 md:px-6 md:py-4">
        <div aria-hidden className="w-10" />
        <div className="text-center">
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-secondary)' }}>{title}</h1>
        </div>
        <button
          type="button"
          aria-label="Nieuw"
          onClick={onNew}
          className="rounded-full border px-3 py-2 text-sm font-semibold transition hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          style={{ borderColor: 'rgba(32,178,170,0.35)', color: 'var(--color-secondary)' }}
        >
          <span className="sr-only">Nieuwe actie</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
