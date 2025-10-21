export function trackRecordingEvent(type: string, payload?: Record<string, any>) {
  // Placeholder telemetry; integrate with real analytics later
  try { console.log('[rec]', type, payload || {}); } catch {}
}

