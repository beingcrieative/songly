"use client";

import { useEffect, useRef, useState } from 'react';

export default function AudioMiniPlayer({ src, title, imageUrl, fixed = true }: { src: string | null; title?: string; imageUrl?: string | null; fixed?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [expanded, setExpanded] = useState(false);
  if (!src) return null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const play = async () => {
      try {
        await el.play();
      } catch {}
    };
    play();
  }, [src]);

  const Card = (
      <div className="flex items-center gap-3 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/90 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/80">
        {imageUrl ? (
          <img src={imageUrl} alt="Cover" className="h-10 w-10 rounded-md object-cover border border-[rgba(15,23,42,0.08)]" />
        ) : (
          <div className="h-10 w-10 rounded-md border border-[rgba(15,23,42,0.08)]" style={{ backgroundImage: 'var(--gradient-soft)' }} aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="truncate text-sm font-semibold" style={{ color: 'var(--color-secondary)' }} title={title}>{title}</div>
          ) : null}
          <audio ref={ref} src={src} controls className="w-full" />
        </div>
        <button
          className="rounded-full border px-3 py-1 text-xs font-semibold transition hover:shadow"
          style={{ borderColor: 'rgba(32,178,170,0.35)', color: 'var(--color-secondary)' }}
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Sluit speler' : 'Open speler'}
        >
          {expanded ? 'Sluit' : 'Open'}
        </button>
      </div>
  );

  if (!fixed) {
    return Card;
  }

  return (
    <div className="fixed right-4 left-4 z-40 md:bottom-4 md:left-auto" style={{ bottom: `calc(64px + env(safe-area-inset-bottom))` }}>
      {Card}
    </div>
  );
}
