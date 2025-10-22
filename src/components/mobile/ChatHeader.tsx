"use client";

import React from "react";

export default function ChatHeader({ title, onNew }: { title: string; onNew?: () => void }) {
  return (
    <div className="sticky top-0 z-30 border-b border-[rgba(15,23,42,0.08)] bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 pt-safe">
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-3 md:px-6 md:py-4">
        <div className="text-center">
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-secondary)' }}>{title}</h1>
        </div>
      </div>
    </div>
  );
}
