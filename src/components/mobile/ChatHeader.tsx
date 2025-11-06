"use client";

import React from "react";

export default function ChatHeader({ title, onNew }: { title: string; onNew?: () => void }) {
  return (
    <div 
      className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85 pt-safe shadow-sm"
      style={{
        borderColor: 'rgba(15, 23, 42, 0.06)',
        boxShadow: '0 1px 3px -1px rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-3.5 md:px-6 md:py-4">
        <div className="text-center relative">
          {/* Subtle gradient accent line */}
          <div 
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-0.5 rounded-full opacity-60"
            style={{
              background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            }}
          />
          <h1 
            className="text-lg md:text-xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}
