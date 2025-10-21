# Recording & Queue E2E Plan (Phase 2)

- Devices: iPhone (Safari PWA), Android (Chrome PWA), Desktop (Chrome)
- Scenarios:
  - Start/stop 15s recording; cancel mid-way
  - Offline start: record + queue; online resume triggers upload
  - Background sync (Android): verify `sync` runs and network requests fire
  - iOS fallback: retry prompt when online; manual upload succeeds
  - Permission denial: show graceful error; no crash
- Success: blob saved locally; when online, server accepts upload; UI shows progress and confirmation

