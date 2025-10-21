"use client";
import { useEffect, useRef, useState } from 'react';

export default function DrawerSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);

  useEffect(() => {
    if (!open) setY(0);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        ref={ref}
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-lg p-4"
        style={{ transform: `translateY(${y}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300 mb-3" />
        {children}
      </div>
    </div>
  );
}

