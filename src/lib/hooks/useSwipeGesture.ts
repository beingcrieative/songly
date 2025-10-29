"use client";

import { useRef, useCallback, useEffect } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance to trigger swipe (pixels)
  enabled?: boolean;
}

interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * useSwipeGesture Hook
 * Detects swipe gestures on touch devices
 * Supports left, right, up, and down swipes
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true,
}: SwipeGestureOptions) {
  const elementRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<TouchPosition | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      timestamp: Date.now(),
    };
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStartRef.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      timestamp: Date.now(),
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.timestamp - touchStartRef.current.timestamp;

    // Ignore very quick touches (likely accidental)
    if (deltaTime < 100) {
      touchStartRef.current = null;
      return;
    }

    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if swipe exceeds threshold
    if (Math.max(absX, absY) < threshold) {
      touchStartRef.current = null;
      return;
    }

    // Horizontal swipe
    if (absX > absY) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    // Vertical swipe
    else {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    touchStartRef.current = null;
  }, [enabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);

  return elementRef;
}

/**
 * useSwipeActions Hook
 * Convenient hook for common swipe actions on cards
 */
export function useSwipeActions(options: {
  onPlay?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  enabled?: boolean;
}) {
  return useSwipeGesture({
    onSwipeLeft: options.onArchive || options.onDelete,
    onSwipeRight: options.onPlay,
    threshold: 40,
    enabled: options.enabled,
  });
}

export default useSwipeGesture;
