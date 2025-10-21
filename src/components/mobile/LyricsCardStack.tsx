"use client";
import React from 'react';

export default function LyricsCardStack({ options, onSelect, onRegenerate, onRefine }: {
  options: { title?: string; text: string }[];
  onSelect: (index: number) => void;
  onRegenerate: () => void;
  onRefine: (index: number) => void;
}) {
  if (!options?.length) return null;
  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <div key={i} className="rounded-xl border p-3 bg-white shadow-sm">
          {opt.title ? <div className="font-medium mb-1">{opt.title}</div> : null}
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{opt.text}</pre>
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 text-sm border rounded" onClick={() => onSelect(i)}>Kies</button>
            <button className="px-3 py-1 text-sm border rounded" onClick={() => onRefine(i)}>Verfijn</button>
            {i === 0 && (
              <button className="px-3 py-1 text-sm border rounded" onClick={onRegenerate}>Nieuwe opties</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

