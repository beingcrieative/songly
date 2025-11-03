"use client";

import React from "react";

type Size = "sm" | "md" | "lg";

export interface AvatarProps {
  photoUrl?: string | null;
  name?: string | null;
  size?: Size;
  className?: string;
}

const SIZE_MAP: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export default function Avatar({ photoUrl, name, size = "md", className = "" }: AvatarProps) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const label = name ? `${name}` : "Gebruiker";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={label}
        className={`${SIZE_MAP[size]} rounded-full object-cover border-2 border-white shadow-md transition-transform duration-200 md:hover:scale-110 ${className}`}
        style={{
          boxShadow: "0 4px 12px -2px rgba(15, 23, 42, 0.15)",
        }}
      />
    );
  }
  return (
    <div
      aria-label={label}
      className={`${SIZE_MAP[size]} rounded-full grid place-items-center font-bold text-white transition-transform duration-200 md:hover:scale-110 ${className}`}
      style={{
        backgroundImage: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)",
        boxShadow: "0 4px 16px -4px rgba(32, 178, 170, 0.4), 0 2px 8px -2px rgba(74, 222, 128, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
      }}
    >
      <span aria-hidden className="drop-shadow-sm">{initial}</span>
    </div>
  );
}

