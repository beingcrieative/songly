"use client";

import { useEffect, useState } from 'react';

export function useKeyboardOpen(threshold = 140) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;

    const onChange = () => {
      // Heuristic: keyboard considered open when the layout viewport height shrinks significantly
      const delta = window.innerHeight - vv.height;
      setIsOpen(delta > threshold);
      // Also add a data attribute for CSS hooks
      document.documentElement.toggleAttribute('data-kb-open', delta > threshold);
    };

    vv.addEventListener('resize', onChange);
    vv.addEventListener('scroll', onChange);
    onChange();
    return () => {
      vv.removeEventListener('resize', onChange);
      vv.removeEventListener('scroll', onChange);
      document.documentElement.removeAttribute('data-kb-open');
    };
  }, [threshold]);

  return isOpen;
}

