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
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export default function Avatar({ photoUrl, name, size = "md", className = "" }: AvatarProps) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const label = name ? `${name}` : "Gebruiker";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={label}
        className={`${SIZE_MAP[size]} rounded-full object-cover border border-[rgba(15,23,42,0.08)] ${className}`}
      />
    );
  }
  return (
    <div
      aria-label={label}
      className={`${SIZE_MAP[size]} rounded-full grid place-items-center font-semibold text-white ${className}`}
      style={{
        backgroundImage: "linear-gradient(135deg, var(--color-secondary), var(--color-primary))",
      }}
    >
      <span aria-hidden>{initial}</span>
    </div>
  );
}

