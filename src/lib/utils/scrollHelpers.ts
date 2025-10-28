/**
 * Task 4.1: Scroll utility functions for chat auto-scroll
 *
 * These utilities help manage scroll position and auto-scroll behavior
 * in the chat interface.
 */

/**
 * Check if the scroll position is near the bottom of a container
 *
 * @param container - The scrollable container element
 * @param threshold - Distance from bottom in pixels (default: 200px)
 * @returns true if scroll is within threshold of bottom, false otherwise
 *
 * @example
 * const container = chatContainerRef.current;
 * if (isNearBottom(container)) {
 *   scrollToBottom(container);
 * }
 */
export function isNearBottom(
  container: HTMLElement | null,
  threshold = 200
): boolean {
  if (!container) return false;

  const { scrollTop, scrollHeight, clientHeight } = container;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  return distanceFromBottom <= threshold;
}

/**
 * Smoothly scroll a container to the bottom
 *
 * @param container - The container element to scroll
 * @param behavior - Scroll behavior: 'smooth' or 'instant' (default: 'smooth')
 *
 * @example
 * scrollToBottom(chatContainerRef.current);
 * scrollToBottom(chatContainerRef.current, 'instant'); // No animation
 */
export function scrollToBottom(
  container: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth'
): void {
  if (!container) return;

  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  });
}

/**
 * Scroll a specific element into view
 *
 * @param element - The element to scroll into view
 * @param behavior - Scroll behavior: 'smooth' or 'instant' (default: 'smooth')
 * @param block - Alignment: 'start', 'center', 'end', 'nearest' (default: 'end')
 *
 * @example
 * const bottomSentinel = bottomRef.current;
 * scrollToElement(bottomSentinel, 'smooth', 'end');
 */
export function scrollToElement(
  element: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth',
  block: ScrollLogicalPosition = 'end'
): void {
  if (!element) return;

  element.scrollIntoView({
    behavior,
    block,
  });
}

/**
 * Get the current scroll position as a percentage (0-100)
 *
 * @param container - The scrollable container
 * @returns Scroll position percentage, or 0 if container is null
 *
 * @example
 * const scrollPercent = getScrollPercentage(chatContainerRef.current);
 * console.log(`Scrolled ${scrollPercent}% from top`);
 */
export function getScrollPercentage(container: HTMLElement | null): number {
  if (!container) return 0;

  const { scrollTop, scrollHeight, clientHeight } = container;
  const maxScroll = scrollHeight - clientHeight;

  if (maxScroll <= 0) return 100; // Fully scrolled if no scrollable content

  return (scrollTop / maxScroll) * 100;
}

/**
 * Save the current scroll position of a container
 *
 * @param container - The scrollable container
 * @returns Object with scrollTop and scrollHeight, or null if container is null
 *
 * @example
 * const position = saveScrollPosition(chatContainerRef.current);
 * // ... add new content ...
 * restoreScrollPosition(chatContainerRef.current, position);
 */
export function saveScrollPosition(container: HTMLElement | null): {
  scrollTop: number;
  scrollHeight: number;
} | null {
  if (!container) return null;

  return {
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
  };
}

/**
 * Restore scroll position after content changes (e.g., loading history)
 *
 * @param container - The scrollable container
 * @param savedPosition - Previously saved scroll position
 *
 * @example
 * const position = saveScrollPosition(chatContainerRef.current);
 * // ... prepend old messages ...
 * restoreScrollPosition(chatContainerRef.current, position);
 */
export function restoreScrollPosition(
  container: HTMLElement | null,
  savedPosition: { scrollTop: number; scrollHeight: number } | null
): void {
  if (!container || !savedPosition) return;

  const heightAdded = container.scrollHeight - savedPosition.scrollHeight;

  // Adjust scroll position to maintain the same view
  container.scrollTop = savedPosition.scrollTop + heightAdded;
}
