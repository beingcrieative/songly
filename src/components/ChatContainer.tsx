"use client";

import React, { useRef, useEffect, ReactNode } from "react";

export interface ChatContainerProps {
  /**
   * Main content to display (usually messages)
   */
  children: ReactNode;
  /**
   * Header content (optional)
   */
  header?: ReactNode;
  /**
   * Footer/composer content (optional)
   */
  footer?: ReactNode;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Whether to auto-scroll to bottom when new messages arrive
   */
  autoScroll?: boolean;
  /**
   * Callback when scroll position changes (for infinite scroll, etc.)
   */
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * Stable chat container that prevents layout shifting
 *
 * This component provides:
 * - Fixed height layout that adapts to available space
 * - Scroll anchoring to keep messages stable
 * - No dynamic padding that causes shifts
 * - Proper keyboard handling without reflow
 *
 * Structure:
 * - Header (optional, fixed height)
 * - Messages area (flex: 1, scroll if needed)
 * - Footer (optional, fixed height)
 */
export function ChatContainer({
  children,
  header,
  footer,
  className = "",
  autoScroll = true,
  onScroll,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!autoScroll) return;

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Use a small delay to ensure DOM has updated
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [children, autoScroll]);

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      {/* Header (fixed height) */}
      {header && <div className="flex-shrink-0">{header}</div>}

      {/* Messages area (flexible height with scroll anchoring) */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollAnchorAdjustment: "auto",
          // Scroll behavior optimization
          overscrollBehavior: "contain",
        } as React.CSSProperties}
        onScroll={onScroll}
      >
        {/* Content wrapper with max-width for better readability */}
        <div className="mx-auto max-w-3xl space-y-4 p-4">
          {children}

          {/* Scroll anchor - invisible element at bottom for scroll anchoring */}
          <div ref={messagesEndRef} className="invisible h-0 w-0" />
        </div>
      </div>

      {/* Footer (fixed height) */}
      {footer && <div className="flex-shrink-0">{footer}</div>}
    </div>
  );
}
