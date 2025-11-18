"use client";

import React from "react";

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onNew?: () => void;
}

export default function ChatHeader({ title, subtitle, onNew }: ChatHeaderProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-[rgba(15,23,42,0.08)] bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 pt-safe">
      <div
        className={
          "mx-auto flex max-w-3xl items-center px-4 py-3 md:px-6 md:py-4 " +
          (onNew || subtitle ? "justify-between" : "justify-center")
        }
      >
        <div className={subtitle ? "text-left" : "text-center"}>
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--color-secondary)" }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[rgba(15,23,42,0.6)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {onNew ? (
          <button
            type="button"
            onClick={onNew}
            className="ml-3 inline-flex items-center gap-1 rounded-full border border-[rgba(15,23,42,0.12)] bg-white/80 px-3 py-1 text-xs font-semibold text-[rgba(15,23,42,0.8)] shadow-sm"
          >
            <span>Lyrics &amp; geluid</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
