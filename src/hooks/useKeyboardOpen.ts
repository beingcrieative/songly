"use client";

import { useEffect, useState, useRef } from 'react';

/**
 * Hook to detect when the on-screen keyboard is open on mobile devices.
 *
 * Uses the Visual Viewport API to detect viewport height changes.
 * When the keyboard opens, the viewport height shrinks significantly.
 *
 * @param threshold - The minimum height difference (in px) to consider keyboard open. Default: 140px
 * @param options - Optional callbacks for keyboard state changes
 * @param options.onKeyboardOpen - Called when keyboard opens
 * @param options.onKeyboardClose - Called when keyboard closes
 * @param options.debug - Enable debug logging (default: false)
 *
 * @returns boolean - true if keyboard is open, false otherwise
 *
 * @example
 * const isKeyboardOpen = useKeyboardOpen(140, {
 *   onKeyboardOpen: () => console.log('Keyboard opened'),
 *   onKeyboardClose: () => console.log('Keyboard closed'),
 * });
 */
export function useKeyboardOpen(
  threshold = 140,
  options?: {
    onKeyboardOpen?: () => void;
    onKeyboardClose?: () => void;
    debug?: boolean;
  }
) {
  const [isOpen, setIsOpen] = useState(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;

    const onChange = () => {
      // Heuristic: keyboard considered open when the layout viewport height shrinks significantly
      const delta = window.innerHeight - vv.height;
      const keyboardOpen = delta > threshold;

      // Debug logging
      if (options?.debug) {
        console.log('[useKeyboardOpen]', {
          innerHeight: window.innerHeight,
          viewportHeight: vv.height,
          delta,
          threshold,
          isOpen: keyboardOpen,
        });
      }

      setIsOpen(keyboardOpen);

      // Add data attribute for CSS hooks
      document.documentElement.toggleAttribute('data-kb-open', keyboardOpen);

      // Trigger callbacks on state change
      if (keyboardOpen !== prevIsOpenRef.current) {
        if (keyboardOpen && options?.onKeyboardOpen) {
          options.onKeyboardOpen();
        } else if (!keyboardOpen && options?.onKeyboardClose) {
          options.onKeyboardClose();
        }
        prevIsOpenRef.current = keyboardOpen;
      }
    };

    vv.addEventListener('resize', onChange);
    vv.addEventListener('scroll', onChange);

    // Initial check
    onChange();

    return () => {
      vv.removeEventListener('resize', onChange);
      vv.removeEventListener('scroll', onChange);
      document.documentElement.removeAttribute('data-kb-open');
    };
  }, [threshold, options]);

  return isOpen;
}

