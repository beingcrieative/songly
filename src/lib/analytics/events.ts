/**
 * Analytics Events for Lyrics Compare and Selection Feature
 * Task 5.1: Define analytics events for tracking user behavior
 */

export enum LyricsAnalyticsEvent {
  LYRICS_OPTIONS_SHOWN = 'lyrics_options_shown',
  LYRICS_OPTION_SELECTED = 'lyrics_option_selected',
  LYRICS_REGENERATED = 'lyrics_regenerated',
  LYRICS_REFINED = 'lyrics_refined',
}

interface LyricsOptionsShownPayload {
  taskId: string;
  variantCount: number;
  conversationId?: string;
}

interface LyricsOptionSelectedPayload {
  taskId: string;
  variantIndex: number;
  conversationId?: string;
}

interface LyricsRegeneratedPayload {
  conversationId?: string;
  reason?: string; // 'timeout' | 'user_request' | 'error'
}

interface LyricsRefinedPayload {
  conversationId?: string;
  refinementType: 'auto' | 'manual_edit';
  hasUsedRefineBefore: boolean;
}

/**
 * Track when lyrics options are shown to the user
 */
export function trackLyricsOptionsShown(payload: LyricsOptionsShownPayload) {
  if (typeof window === 'undefined') return;

  console.log('[Analytics]', LyricsAnalyticsEvent.LYRICS_OPTIONS_SHOWN, payload);

  // TODO: Integrate with your analytics provider (e.g., Mixpanel, Amplitude, GA4)
  // Example:
  // window.analytics?.track(LyricsAnalyticsEvent.LYRICS_OPTIONS_SHOWN, payload);
}

/**
 * Track when user selects a lyrics option
 */
export function trackLyricsOptionSelected(payload: LyricsOptionSelectedPayload) {
  if (typeof window === 'undefined') return;

  console.log('[Analytics]', LyricsAnalyticsEvent.LYRICS_OPTION_SELECTED, payload);

  // TODO: Integrate with your analytics provider
  // window.analytics?.track(LyricsAnalyticsEvent.LYRICS_OPTION_SELECTED, payload);
}

/**
 * Track when lyrics are regenerated
 */
export function trackLyricsRegenerated(payload: LyricsRegeneratedPayload) {
  if (typeof window === 'undefined') return;

  console.log('[Analytics]', LyricsAnalyticsEvent.LYRICS_REGENERATED, payload);

  // TODO: Integrate with your analytics provider
  // window.analytics?.track(LyricsAnalyticsEvent.LYRICS_REGENERATED, payload);
}

/**
 * Track when lyrics are refined
 */
export function trackLyricsRefined(payload: LyricsRefinedPayload) {
  if (typeof window === 'undefined') return;

  console.log('[Analytics]', LyricsAnalyticsEvent.LYRICS_REFINED, payload);

  // TODO: Integrate with your analytics provider
  // window.analytics?.track(LyricsAnalyticsEvent.LYRICS_REFINED, payload);
}
