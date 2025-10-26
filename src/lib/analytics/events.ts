/**
 * Analytics Events for Lyrics Compare and Selection Feature
 * Task 5.1: Define analytics events for tracking user behavior
 */

export enum LyricsAnalyticsEvent {
  LYRICS_GENERATION_STARTED = 'lyrics_generation_started',
  LYRICS_OPTIONS_SHOWN = 'lyrics_options_shown',
  LYRICS_OPTION_SELECTED = 'lyrics_option_selected',
  LYRICS_REGENERATED = 'lyrics_regenerated',
  LYRICS_REFINED = 'lyrics_refined',
  LYRICS_MANUALLY_EDITED = 'lyrics_manually_edited',
  LYRICS_PROCEEDED_TO_MUSIC = 'lyrics_proceeded_to_music',
}

interface LyricsGenerationStartedPayload {
  conversationId?: string;
  conversationRounds?: number;
  readinessScore?: number;
  templateId?: string;
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

interface LyricsManuallyEditedPayload {
  conversationId?: string;
  lyricsLength: number;
  hadPreviousVersion: boolean;
}

interface LyricsProceededToMusicPayload {
  conversationId?: string;
  lyricsSource: 'suno' | 'suno-refine' | 'manual-edit';
  wasRefined: boolean;
  wasManuallyEdited: boolean;
}

/**
 * Task 6.0: Track when lyrics generation starts
 */
export function trackLyricsGenerationStarted(payload: LyricsGenerationStartedPayload) {
  if (typeof window === 'undefined') return;

  console.log('[Analytics]', LyricsAnalyticsEvent.LYRICS_GENERATION_STARTED, payload);

  // TODO: Integrate with your analytics provider
  // window.analytics?.track(LyricsAnalyticsEvent.LYRICS_GENERATION_STARTED, payload);
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

/**
 * Task 6.0: Track when lyrics are manually edited
 */
export function trackLyricsManuallyEdited(payload: LyricsManuallyEditedPayload) {
  if (typeof window === 'undefined') return;

  console.log('[Analytics]', LyricsAnalyticsEvent.LYRICS_MANUALLY_EDITED, payload);

  // TODO: Integrate with your analytics provider
  // window.analytics?.track(LyricsAnalyticsEvent.LYRICS_MANUALLY_EDITED, payload);
}

/**
 * Task 6.0: Track when user proceeds from lyrics to music generation
 */
export function trackLyricsProceededToMusic(payload: LyricsProceededToMusicPayload) {
  if (typeof window === 'undefined') return;

  console.log('[Analytics]', LyricsAnalyticsEvent.LYRICS_PROCEEDED_TO_MUSIC, payload);

  // TODO: Integrate with your analytics provider
  // window.analytics?.track(LyricsAnalyticsEvent.LYRICS_PROCEEDED_TO_MUSIC, payload);
}

// General analytics helper
function track(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  console.log('[Analytics]', eventName, payload);
  // window.analytics?.track(eventName, payload);
}

// Library analytics
type LibraryEventPayload = Record<string, unknown>;

function trackLibrary(eventName: string, payload: LibraryEventPayload) {
  track(eventName, payload);
}

export function trackLibraryOpen(payload: { userId: string }) {
  trackLibrary('library_open', payload);
}

export function trackLibraryPlay(payload: { songId: string; variantId?: string }) {
  trackLibrary('library_play', payload);
}

export function trackLibraryDelete(payload: { songId?: string; conversationId?: string }) {
  trackLibrary('library_delete', payload);
}

export function trackLibraryShare(payload: { songId: string; publicId: string }) {
  trackLibrary('library_share', payload);
}

// PRD-0015: New analytics events for async generation flow

export function trackStatusBadgeShown(payload: {
  status: string;
  songId: string;
}) {
  track('status_badge_shown', payload);
}

export function trackLyricsVariantSelected(payload: {
  songId: string;
  variantIndex: number;
  timeToSelect: number; // ms since modal opened
}) {
  track('lyrics_variant_selected', payload);
}

export function trackLyricsSwipe(payload: {
  songId: string;
  direction: 'left' | 'right';
  fromIndex: number;
  toIndex: number;
}) {
  track('lyrics_swipe', payload);
}

export function trackGenerationRetry(payload: {
  songId: string;
  phase: 'lyrics' | 'music';
  retryCount: number;
}) {
  track('generation_retry', payload);
}

export function trackNotificationClick(payload: {
  type: 'lyrics_ready' | 'music_ready';
  songId: string;
  timeToClick: number; // ms since notification sent
}) {
  track('notification_click', payload);
}
