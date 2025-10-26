# PRD-0015: Library Herontwerp voor Async Generation Flow

**Status**: Draft
**Datum**: 26 oktober 2025
**Eigenaar**: Product & Engineering
**Prioriteit**: P0 (Blocker voor async generation rollout)

---

## 📋 Executive Summary

De Library wordt het centrale zenuwcentrum van de app waar gebruikers de volledige levenscyclus van hun liedjes volgen - van generatie tot afspelen. Deze herontwerp ondersteunt de nieuwe async generation flow (PRD-0014) en maakt de Library intuïtiever, efficiënter en visueel aantrekkelijker.

**Probleem**: Huidige Library toont alleen voltooide liedjes. Met async generation moeten gebruikers:
- Realtime status zien van genererende liedjes
- Actie kunnen ondernemen wanneer lyrics klaar zijn (variant kiezen)
- Notificaties ontvangen en direct naar relevante items kunnen navigeren
- Een duidelijk overzicht hebben van alles wat er speelt

**Oplossing**: Complete Library herontwerp met:
- **Realtime status tracking** via InstantDB subscriptions
- **Actie-gerichte UI** met prominente badges en CTAs
- **Swipeable lyrics comparison** op mobile (1/2, 2/2 indicators)
- **Smart sorting** - items die actie vereisen bovenaan
- **Badge counter** op Library tab
- **Nederlandse UX** met duidelijke feedback

---

## 🎯 Doelen & Success Metrics

### Primaire Doelen

1. **Gebruikers begrijpen de generatie status** (100% clarity)
2. **Snelle actie op lyrics_ready** (< 2 min gemiddeld)
3. **0% timeout errors** (callbacks vervangen polling)
4. **Hogere voltooiingsrate** (meer finished songs per sessie)

### Success Metrics (OKRs)

| Metric | Huidig | Doel | Meting |
|--------|--------|------|--------|
| **Lyrics keuze tijd** | N/A (blocking) | < 2 min | Time from notification to variant selection |
| **Timeout errors** | ~15% | 0% | Error rate in lyrics/music generation |
| **Voltooide liedjes** | 2.1/sessie | 3.5/sessie | Songs with status="ready" or "complete" |
| **Notificatie engagement** | N/A | 60%+ | Users returning within 10 min of notification |
| **Retry success rate** | N/A | 80%+ | Failed songs successfully retried |

### Key Performance Indicators (KPIs)

- **Library open rate**: 80% of sessions
- **Action completion rate**: 90% of lyrics_ready items get variant selected
- **Error recovery rate**: 75% of failed items get retried
- **Session duration**: +30% increase (users stay engaged)

---

## 👥 User Persona & Journey

### Primaire Persona: Sarah (27, relatie van 3 jaar)

**Context**: Sarah heeft net een gesprek in Studio afgerond en wil een liedje maken voor haar verjaardag van haar partner.

**Huidige Flow (Problematisch)**:
```
Studio gesprek ✓
    ↓
Lyrics genereren... [BLOCKING MODAL]
    ↓ (90 seconden wachten)
[Timeout error: "Het duurt te lang"]
    ↓
Frustratie → App sluiten
```

**Nieuwe Flow (Gewenst)**:
```
Studio gesprek ✓
    ↓
"Je liedje wordt gegenereerd!" [TOAST]
    ↓
Redirect naar Library
    ↓
Zie song card met badge: "Tekst genereren..." 🔵
    ↓
[Sarah kan nu andere dingen doen, app sluiten, etc.]
    ↓
⏰ 45 seconden later
    ↓
[PUSH NOTIFICATION] "Je songteksten zijn klaar! 🎵"
    ↓
Sarah opent app → Library
    ↓
Song card nu met badge: "Klaar om te kiezen" 🟣 [PULSING]
    ↓
Klik op card → Swipeable lyrics modal
    ↓
Swipe tussen variant 1 en 2 [INDICATOR: "1/2", "2/2"]
    ↓
Kies variant → "Muziek genereren..." badge 🟠
    ↓
[Sarah sluit app weer]
    ↓
⏰ 60 seconden later
    ↓
[PUSH NOTIFICATION] "Je liedje is klaar! 🎵"
    ↓
Sarah opent app → Library
    ↓
Song card met badge: "Klaar om te spelen" 🟢 [PULSING]
    ↓
Klik Play → Audio player → Delen met partner ❤️
```

**Pain Points Opgelost**:
- ✅ Geen blocking modals
- ✅ Kan app sluiten tijdens generatie
- ✅ Duidelijke status updates
- ✅ Notificaties op juiste moment
- ✅ Intuïtieve volgende stap

---

## 🎨 UI/UX Design Specification

### Design Principles

1. **Status-First Design**: Status is altijd prominent zichtbaar
2. **Action-Oriented**: Duidelijke CTAs bij elke status
3. **Progressive Disclosure**: Complexiteit verbergen tot nodig
4. **Mobile-First**: Touch-vriendelijk, swipeable, native feelings
5. **House Style Adherence**: Consistent met bestaande design system

### Huisstijl Integratie

**Kleurenpalet** (van globals.css):
```css
Primary: #4ade80 (Bright Green) - Success states
Secondary: #20b2aa (Teal) - Interactive elements
Rose: #f43f5e (Rose-500) - Primary actions
Slate: #0f172a (Slate-900) - Text
```

**Status Kleuren** (nieuw):
```css
Generating Lyrics: #3b82f6 (Blue-500) - Thinking/processing
Lyrics Ready: #ec4899 (Pink-500) - Action required (pulsing)
Generating Music: #a855f7 (Purple-500) - Creating
Ready to Play: #10b981 (Emerald-500) - Success (pulsing)
Failed: #ef4444 (Red-500) - Error state
```

**Animaties**:
- **Pulse (2s loop)**: Voor "action required" states (lyrics_ready, ready)
- **Spinner**: Voor generating states
- **Slide-in**: Voor nieuwe items in lijst
- **Fade-out**: Voor verwijderde items

### Layout Anatomy

```
┌─────────────────────────────────────────────┐
│ Header                                       │ ← Logo + "Bibliotheek" title
│ [🎵 Mijn Liedjes]              [Badge: 3]   │ ← Badge counter voor actie items
├─────────────────────────────────────────────┤
│ Search & Filters                            │
│ [🔍 Zoeken...]  [Status ▾]  [Sorteer ▾]   │
├─────────────────────────────────────────────┤
│                                             │
│ ┌───────┐ ┌───────┐ ┌───────┐             │ ← Grid: 3 cols (lg)
│ │ Song  │ │ Song  │ │ Song  │             │         2 cols (md)
│ │ Card  │ │ Card  │ │ Card  │             │         1 col (sm)
│ │  🟣   │ │  🔵   │ │  🟢   │             │
│ └───────┘ └───────┘ └───────┘             │
│                                             │
│ ┌───────┐ ┌───────┐ ┌───────┐             │
│ │ Song  │ │ Song  │ │ Song  │             │
│ │ Card  │ │ Card  │ │ Card  │             │
│ │  🔴   │ │  ⚪   │ │  ⚪   │             │
│ └───────┘ └───────┘ └───────┘             │
│                                             │
├─────────────────────────────────────────────┤
│ Audio Mini Player (if playing)              │ ← Floating player
├─────────────────────────────────────────────┤
│ [🎵 Studio] [📚 Bibliotheek] [⚙️] [🌐]    │ ← Bottom nav
└─────────────────────────────────────────────┘
```

### Song Card States

**Variant A: Generating Lyrics** (Blauw, Spinner)
```
┌─────────────────────────────┐
│ [Cover Placeholder]         │
│                             │
│ 🔵 Tekst genereren...      │ ← Badge (animated spinner)
│                             │
│ Voor Emma ❤️               │ ← Title
│ Gemaakt 2 minuten geleden   │ ← Timestamp
│                             │
│ [Annuleren]                 │ ← Optional (Task 4.2.2 open question)
└─────────────────────────────┘
```

**Variant B: Lyrics Ready** (Roze, Pulsing)
```
┌─────────────────────────────┐
│ [Cover Placeholder]         │
│                             │
│ 🟣 Klaar om te kiezen ✨   │ ← Badge (pulsing animation)
│                             │
│ Voor Emma ❤️               │
│ Teksten klaar 30 sec geleden│
│                             │
│ [Kies Lyrics →]            │ ← Primary CTA (Rose-500)
└─────────────────────────────┘
```

**Variant C: Generating Music** (Paars, Spinner)
```
┌─────────────────────────────┐
│ [Cover Placeholder]         │
│                             │
│ 🟠 Muziek genereren...     │
│                             │
│ Voor Emma ❤️               │
│ Lyrics gekozen 1 min geleden│
│                             │
│ [Details bekijken]          │ ← Ghost button
└─────────────────────────────┘
```

**Variant D: Ready to Play** (Groen, Pulsing)
```
┌─────────────────────────────┐
│ [Song Cover Image]          │
│                             │
│ 🟢 Klaar om te spelen ✨   │
│                             │
│ Voor Emma ❤️               │
│ Klaar 5 minuten geleden     │
│                             │
│ [▶️ Speel af] [↗️ Deel]   │ ← Primary actions
└─────────────────────────────┘
```

**Variant E: Failed** (Rood, Error icon)
```
┌─────────────────────────────┐
│ [Cover Placeholder]         │
│                             │
│ 🔴 Mislukt                 │
│                             │
│ Voor Emma ❤️               │
│ Error: Suno API timeout     │
│                             │
│ [🔄 Probeer opnieuw]       │ ← Retry CTA (Rose border)
└─────────────────────────────┘
```

### Choose Lyrics Modal (Mobile Swipeable)

**Desktop View** (Side-by-side):
```
┌──────────────────────────────────────────────────────┐
│                 Kies je favoriete lyrics             │
│                                                       │
│ ┌──────────────────────┐  ┌──────────────────────┐ │
│ │ Variant 1            │  │ Variant 2            │ │
│ │                      │  │                      │ │
│ │ In de stilte van     │  │ Onder de sterren     │ │
│ │ de nacht...          │  │ zacht en stil...     │ │
│ │ [Scrollable]         │  │ [Scrollable]         │ │
│ │                      │  │                      │ │
│ │                      │  │                      │ │
│ │ [✓ Kies deze]        │  │ [✓ Kies deze]        │ │
│ └──────────────────────┘  └──────────────────────┘ │
│                                                       │
│                  [Annuleren]                          │
└──────────────────────────────────────────────────────┘
```

**Mobile View** (Swipeable met indicator):
```
┌─────────────────────────────┐
│   Kies je favoriete lyrics  │
│                             │
│   ◉ ○                       │ ← Indicator (1/2)
│   Variant 1 van 2           │
│                             │
│  ┌──────────────────────┐  │
│  │                       │  │
│  │ In de stilte van      │  │
│  │ de nacht, vind ik    │  │
│  │ jouw lach...          │  │
│  │ [Scrollable Content]  │  │
│  │                       │  │
│  │                       │  │
│  │                       │  │
│  └──────────────────────┘  │
│                             │
│   [← Swipe voor variant 2]  │ ← Duidelijke instructie
│                             │
│   [✓ Kies deze variant]     │ ← Primary CTA
│   [Annuleren]               │
└─────────────────────────────┘

[User swipes left →]

┌─────────────────────────────┐
│   Kies je favoriete lyrics  │
│                             │
│   ○ ◉                       │ ← Indicator (2/2)
│   Variant 2 van 2           │
│                             │
│  ┌──────────────────────┐  │
│  │                       │  │
│  │ Onder de sterren      │  │
│  │ zacht en stil,        │  │
│  │ hoor ik je stem...    │  │
│  │ [Scrollable Content]  │  │
│  │                       │  │
│  │                       │  │
│  │                       │  │
│  └──────────────────────┘  │
│                             │
│   [Swipe voor variant 1 ←]  │
│                             │
│   [✓ Kies deze variant]     │
│   [Annuleren]               │
└─────────────────────────────┘
```

**Key UX Details**:
- **Indicator**: Grote, duidelijke dots (◉ ○) bovenaan
- **Counter**: "Variant 1 van 2" text label
- **Swipe hint**: Eerste keer tonen: "← Swipe voor variant 2"
- **Scroll vs Swipe**: Vertical scroll voor lyrics, horizontal swipe voor variants
- **Haptic feedback**: Trillen bij swipe tussen variants (iOS/Android)
- **Smooth transitions**: 300ms ease-out animatie

### Empty States

**No Songs Yet**:
```
┌─────────────────────────────┐
│                             │
│         🎵                  │
│                             │
│   Je hebt nog geen liedjes  │
│                             │
│   Begin met het maken van   │
│   je eerste liefdesliedje   │
│                             │
│   [+ Maak je eerste liedje] │ ← Primary CTA
│                             │
└─────────────────────────────┘
```

**All Generating**:
```
┌─────────────────────────────┐
│                             │
│         ⏳                  │
│                             │
│ Je liedjes worden gegenereerd│
│                             │
│ Je ontvangt een notificatie │
│ zodra ze klaar zijn. Voel je│
│ vrij om de app te sluiten!  │
│                             │
│ [Nog een liedje maken]      │
│                             │
└─────────────────────────────┘
```

**Some Failed**:
```
┌─────────────────────────────┐
│                             │
│         ⚠️                  │
│                             │
│  Sommige liedjes zijn mislukt│
│                             │
│ Klik op "Probeer opnieuw"   │
│ bij de rode badges om het   │
│ nogmaals te proberen.       │
│                             │
│ [Toon mislukte liedjes]     │
│                             │
└─────────────────────────────┘
```

---

## 🔧 Technical Specification

### Component Architecture

```
Library Page (src/app/library/page.tsx)
├── Header
│   ├── Logo + Title
│   └── Badge Counter (action items count)
├── Filters (src/app/library/components/Filters.tsx)
│   ├── Search Input
│   ├── Status Dropdown (ALL, Generating, Ready, Failed)
│   └── Sort Dropdown (Action Required, Recent, Alphabetical)
├── Song Grid
│   ├── SongCard[] (enhanced with status badges)
│   │   ├── SongStatusBadge (src/components/SongStatusBadge.tsx) ✓ DONE
│   │   ├── Cover Image
│   │   ├── Title + Metadata
│   │   └── Action Buttons (conditional based on status)
│   └── Empty State (conditional)
├── LyricsChoiceModal (NEW)
│   ├── Desktop: Side-by-side layout
│   ├── Mobile: Swipeable cards
│   ├── Indicator Dots (1/2, 2/2)
│   └── Primary CTA: "Kies deze variant"
├── AudioMiniPlayer (existing, keep)
└── NavTabs (existing, keep)
```

### Data Flow & State Management

**InstantDB Query** (enhanced):
```typescript
// src/lib/library/queries.ts - UPDATE
export function useLibrarySongs(userId: string | undefined) {
  const query = useMemo(() => {
    if (!userId) return {}; // Empty query if no user

    return {
      songs: {
        $: {
          where: {
            'user.id': userId,
            // Status indexed field for efficient filtering
          },
          order: {
            // Smart sort: see below
          },
        },
        // Include new fields from PRD-0014
        generationProgress: {},
        lyricsVariants: {},
        notificationsSent: {},
        lastViewedAt: {},
        // Existing relations
        variants: {
          $: { order: { order: 'asc' } }
        },
        conversation: {},
        user: {},
      },
    };
  }, [userId]);

  return db.useQuery(query);
}
```

**Smart Sorting Algorithm**:
```typescript
// Priority-based sort (client-side after query)
function sortSongsByPriority(songs: Song[]): Song[] {
  return songs.sort((a, b) => {
    // 1. Action Required (highest priority)
    const aPriority = getActionPriority(a.status);
    const bPriority = getActionPriority(b.status);
    if (aPriority !== bPriority) return aPriority - bPriority;

    // 2. Recent activity (lastViewedAt or updatedAt)
    const aTime = a.lastViewedAt || a.updatedAt || 0;
    const bTime = b.lastViewedAt || b.updatedAt || 0;
    return bTime - aTime; // DESC
  });
}

function getActionPriority(status: string): number {
  switch (status) {
    case 'lyrics_ready': return 1; // Highest priority
    case 'ready': return 2;
    case 'generating_lyrics': return 3;
    case 'generating_music': return 4;
    case 'failed': return 5;
    case 'complete': return 6; // Lowest priority
    default: return 99;
  }
}
```

**Badge Counter Logic**:
```typescript
// Count items requiring user action
function getActionItemsCount(songs: Song[]): number {
  return songs.filter(song =>
    song.status === 'lyrics_ready' || song.status === 'ready'
  ).length;
}
```

### API Integrations

**New Endpoints**:

1. **`POST /api/library/songs/{songId}/select-lyrics`**
   ```typescript
   // Select a lyric variant and start music generation
   Body: { variantIndex: number }
   Response: { ok: boolean, message: string }

   Flow:
   1. Update lyricsVariants: set selected: true on chosen variant
   2. Update status: "generating_music"
   3. Update generationProgress.musicStartedAt
   4. Call POST /api/suno with selected lyrics
   5. Return success
   ```

2. **`POST /api/library/songs/{songId}/retry`**
   ```typescript
   // Retry failed generation
   Body: { phase: 'lyrics' | 'music' }
   Response: { ok: boolean, taskId: string }

   Flow:
   1. Check generationProgress.[phase]RetryCount < 3
   2. Increment retry count
   3. Reset error fields
   4. Call appropriate Suno API
   5. Update status to generating_[phase]
   6. Return taskId
   ```

3. **`PATCH /api/library/songs/{songId}/view`**
   ```typescript
   // Update lastViewedAt when user opens song
   Response: { ok: boolean }

   Flow:
   1. Update lastViewedAt: Date.now()
   2. Return success
   ```

**Modified Endpoints**:

- **`GET /api/library/songs`**: Add support for status filtering
- **`DELETE /api/library/songs/{songId}`**: Also delete related conversation if exists

### State Diagram

```
[pending] ──generate──> [generating_lyrics]
                              │
                              │ callback success
                              ↓
                        [lyrics_ready] ◄─── USER ACTION REQUIRED
                              │
                              │ user selects variant
                              ↓
                        [generating_music]
                              │
                              │ callback success
                              ↓
                          [ready] ◄─── USER ACTION: play/share
                              │
                              │ user plays song
                              ↓
                         [complete]

          [any state] ──error──> [failed]
                                    │
                                    │ user retry
                                    ↓
                              [generating_*]
```

### Mobile Swipe Implementation

**Library for Swipeable Cards**:
- Use: `react-swipeable` or `framer-motion` for gestures
- Config:
  ```typescript
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => nextVariant(),
    onSwipedRight: () => prevVariant(),
    preventScrollOnSwipe: true,
    trackMouse: false, // Only touch, not mouse drag
    delta: 50, // Min swipe distance
  });
  ```

**Indicator Component**:
```typescript
function SwipeIndicator({ current, total }: { current: number, total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {/* Dot indicators */}
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              i === current ? "bg-rose-500 scale-125" : "bg-slate-300"
            )}
          />
        ))}
      </div>

      {/* Text label */}
      <span className="text-sm text-slate-600 ml-2">
        Variant {current + 1} van {total}
      </span>
    </div>
  );
}
```

---

## 📱 Mobile-Specific Considerations

### Touch Targets
- Minimum size: 44x44px (Apple HIG, Android Material)
- Spacing between buttons: 8px minimum
- Card tap area: entire card clickable

### Gestures
- **Swipe left/right**: Navigate between lyric variants
- **Pull-to-refresh**: Refresh library list (check for updates)
- **Long press**: Show context menu (share, delete, details)

### Safe Areas
```css
/* Bottom nav with safe area */
.nav-tabs {
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
}

/* Audio player above nav */
.audio-mini-player {
  bottom: calc(64px + env(safe-area-inset-bottom));
}
```

### Performance
- **Virtual scrolling**: For lists > 50 items (use `react-window`)
- **Image lazy loading**: `loading="lazy"` on cover images
- **Skeleton loaders**: Show while data loading
- **Optimistic updates**: Instant UI feedback, sync in background

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// SongCard.test.tsx
describe('SongCard', () => {
  it('shows correct badge for each status', () => {
    // Test all 6 status states
  });

  it('shows primary CTA based on status', () => {
    // lyrics_ready → "Kies Lyrics"
    // ready → "Speel af"
    // failed → "Probeer opnieuw"
  });

  it('disables actions while loading', () => {
    // Test loading states
  });
});

// LyricsChoiceModal.test.tsx
describe('LyricsChoiceModal', () => {
  it('renders side-by-side on desktop', () => {});
  it('renders swipeable on mobile', () => {});
  it('updates indicator on swipe', () => {});
  it('calls onSelect with correct variant', () => {});
});
```

### Integration Tests

```typescript
// library-flow.test.ts
describe('Library Flow', () => {
  it('sorts action required items first', () => {});
  it('updates badge counter when status changes', () => {});
  it('opens lyrics modal on card click', () => {});
  it('starts music generation after variant selection', () => {});
  it('shows retry button for failed items', () => {});
});
```

### E2E Tests (Playwright)

```typescript
// library.spec.ts
test('complete async generation flow', async ({ page }) => {
  // 1. User finishes Studio conversation
  // 2. Redirects to Library
  // 3. See "generating_lyrics" badge
  // 4. Wait for callback (mock)
  // 5. Badge changes to "lyrics_ready"
  // 6. Click card → Open modal
  // 7. Swipe between variants (mobile)
  // 8. Select variant
  // 9. Badge changes to "generating_music"
  // 10. Wait for callback (mock)
  // 11. Badge changes to "ready"
  // 12. Click play → Audio player opens
});

test('retry failed generation', async ({ page }) => {
  // 1. Song with status="failed"
  // 2. Click "Probeer opnieuw"
  // 3. Status changes to "generating_*"
  // 4. Success/failure feedback
});
```

### Manual QA Checklist

- [ ] Status badges correct voor alle 6 states
- [ ] Badge counter updates realtime
- [ ] Smart sorting: actie items bovenaan
- [ ] Swipe werkt smooth op mobile (iOS + Android)
- [ ] Indicator "1/2, 2/2" duidelijk zichtbaar
- [ ] Push notifications deep-linken naar juiste song
- [ ] Retry knop werkt bij failed items
- [ ] Empty states tonen juiste content
- [ ] Dark mode support (if applicable)
- [ ] Accessibility: ARIA labels, keyboard nav
- [ ] Performance: < 3s initial load, smooth scrolling

---

## 🚀 Implementation Plan

### Phase 1: Core UI Components (Week 1)

**Tasks**:
1. ✅ SongStatusBadge component (DONE in PRD-0014)
2. Update SongCard with enhanced badges and CTAs
3. Create LyricsChoiceModal component
   - Desktop: side-by-side layout
   - Mobile: swipeable with indicators
4. Update Filters component with new status options
5. Implement smart sorting algorithm

**Deliverables**:
- All components built and tested
- Storybook stories for each component
- Unit tests passing

### Phase 2: Data & API Integration (Week 1-2)

**Tasks**:
1. Update `useLibrarySongs` query with new fields
2. Implement badge counter logic
3. Create new API endpoints:
   - `POST /api/library/songs/{songId}/select-lyrics`
   - `POST /api/library/songs/{songId}/retry`
   - `PATCH /api/library/songs/{songId}/view`
4. Add InstantDB subscription for realtime updates
5. Implement lastViewedAt tracking

**Deliverables**:
- All API endpoints functional
- InstantDB queries optimized
- Integration tests passing

### Phase 3: Studio Integration (Week 2)

**Tasks**:
1. Update Studio to redirect to Library after lyrics generation start
2. Remove LyricsGenerationProgress blocking modal
3. Add toast notification: "Je liedje wordt gegenereerd!"
4. Update conversation phase management
5. Test complete flow: Studio → Library → Lyrics choice → Music → Play

**Deliverables**:
- Studio redirect working
- No more blocking modals
- Toast notifications functional
- E2E tests passing

### Phase 4: Polish & Optimization (Week 2-3)

**Tasks**:
1. Add pull-to-refresh on mobile
2. Implement virtual scrolling for large lists
3. Add skeleton loaders
4. Optimize image loading (lazy load, blur placeholder)
5. Add haptic feedback on swipe (mobile)
6. Accessibility audit and fixes
7. Performance optimization (Lighthouse > 90)

**Deliverables**:
- Buttery smooth UX
- Accessibility compliance
- Performance metrics met
- All QA checklist items checked

### Phase 5: Rollout & Monitoring (Week 3)

**Tasks**:
1. Feature flag: `NEXT_PUBLIC_ENABLE_LIBRARY_V2`
2. A/B test with 10% users
3. Monitor analytics: success metrics
4. Collect user feedback
5. Iterate based on data
6. Full rollout if metrics positive

**Deliverables**:
- Feature flag system
- Analytics dashboard
- User feedback collected
- Rollout plan executed

---

## 🎨 Design Assets Needed

### Icons
- ✅ Spinner (for generating states) - DONE
- ✅ Check mark (for ready states) - DONE
- ✅ Music note (for playable songs) - DONE
- ✅ Error X (for failed states) - DONE
- 🔲 Swipe indicator arrows (← →)
- 🔲 Dot indicators (◉ ○)

### Animations
- ✅ `pulse-subtle` (2s loop) - DONE
- ✅ `spin` (loading spinner) - DONE
- 🔲 `slide-in-right` (new items)
- 🔲 `fade-out` (deleted items)
- 🔲 `swipe-card` (variant transition)

### Images
- 🔲 Empty state illustrations (optional, text-only is fine)
- 🔲 Placeholder cover images for songs without custom covers

---

## 📊 Analytics & Instrumentation

### Events to Track

```typescript
// src/lib/analytics/events.ts - ADD

// Library opened
trackLibraryOpen({ source: 'nav_tab' | 'notification' | 'studio_redirect' })

// Status badge shown
trackStatusBadgeShown({ status: SongStatus, songId: string })

// Action taken
trackLibraryAction({
  action: 'choose_lyrics' | 'play' | 'retry' | 'delete' | 'share',
  songId: string,
  status: SongStatus
})

// Lyrics variant selected
trackLyricsVariantSelected({
  songId: string,
  variantIndex: number,
  timeToSelect: number, // ms since lyrics_ready
})

// Swipe between variants (mobile)
trackLyricsSwipe({
  songId: string,
  direction: 'left' | 'right',
  fromIndex: number,
  toIndex: number,
})

// Retry generation
trackGenerationRetry({
  songId: string,
  phase: 'lyrics' | 'music',
  retryCount: number,
})

// Notification engagement
trackNotificationClick({
  type: 'lyrics_ready' | 'music_ready',
  songId: string,
  timeToClick: number, // ms since notification sent
})
```

### Dashboards

**Async Generation Funnel**:
```
Studio complete       → 100%
├─ Redirect to Library → 98% (track drops)
├─ Lyrics generated    → 95% (track fails)
├─ Variant selected    → 90% (track abandonment)
├─ Music generated     → 88% (track fails)
└─ Song played         → 75% (GOAL: 80%+)
```

**Engagement Metrics**:
- Average time to select variant: < 2 min
- Retry success rate: 80%+
- Notification → App open rate: 60%+
- Songs completed per session: 3.5+

---

## 🚧 Open Questions & Decisions

### 1. Cancel Button tijdens Generatie?
**Question**: Moeten we een "Annuleren" knop tonen tijdens `generating_lyrics` en `generating_music`?

**Options**:
- **A**: Ja, met confirmatie modal ("Weet je zeker dat je wilt annuleren?")
- **B**: Nee, laat callbacks gewoon afmaken (kan niet gecanceld worden bij Suno API)
- **C**: Ja, maar alleen visueel (zet status op "cancelled", wacht op callback, verwijder dan)

**Recommendation**: **B** - Geen cancel button. Redenen:
- Suno API ondersteunt geen cancellation
- Callbacks komen toch binnen, zou tot inconsistent state leiden
- Gebruiker kan app gewoon sluiten, dat is "cancel" genoeg

**Decision**: [TO BE FILLED BY PRODUCT]

### 2. Tabs tussen Songs/Conversations?
**Question**: Moeten we nog steeds tabs tonen voor Songs vs Conversations, of alleen Songs?

**Current**: Gebruiker antwoordde "e" (alleen Share/Delete blijven), wat suggereert geen tabs meer.

**Recommendation**: **Alleen Songs tab** - Conversations zijn meer een internal concept, niet iets dat gebruikers expliciet willen browsen. Ze worden automatisch gemaakt en gekoppeld aan songs.

**Decision**: Geen tabs, alleen Songs weergeven.

### 3. Conversation Cards Verwijderen?
**Question**: Als we geen Conversations tab hebben, moeten we dan ConversationCard.tsx helemaal verwijderen?

**Options**:
- **A**: Ja, verwijder compleet
- **B**: Nee, keep maar gebruik niet (voor toekomstige features)
- **C**: Integreer in song card (toon conversation details in expanded view)

**Recommendation**: **B** - Behouden maar niet gebruiken. Kan handig zijn voor debug/admin views.

**Decision**: Behouden maar niet tonen in UI.

### 4. Max Retry Count?
**Question**: Hoeveel keer mag een gebruiker een failed generation retrying voordat we het opgeven?

**Options**:
- **A**: 3 retries (standard)
- **B**: 5 retries (generous)
- **C**: Unlimited (maar toon waarschuwing na 3)

**Recommendation**: **A** - 3 retries max. Na 3 failures toon melding: "Er gaat iets mis met deze generatie. Probeer een nieuw liedje te maken."

**Decision**: 3 retries, dan permanent failed.

### 5. Deep Linking bij Notificaties?
**Question**: Moet notification deep-link direct naar lyrics modal openen, of naar Library met song highlighted?

**Options**:
- **A**: Direct modal openen (snelste flow)
- **B**: Library met song highlighted + scroll to position
- **C**: Library met song highlighted + auto-open modal na 500ms

**Recommendation**: **C** - Library highlight + auto-open modal. Dit geeft context (gebruiker ziet waar ze zijn) en is niet te agressief.

**Decision**: **C** - Highlight + auto-open.

### 6. Pull-to-Refresh Behavior?
**Question**: Wat moet pull-to-refresh doen?

**Options**:
- **A**: Re-query InstantDB (instant via subscription anyway)
- **B**: Visuele feedback alleen (data is al realtime)
- **C**: Force re-check Suno API statuses (polling fallback)

**Recommendation**: **B** - Visuele feedback. InstantDB subscriptions zijn al realtime, geen extra query nodig. Toon gewoon "Checking for updates..." en fade out.

**Decision**: **B** - Visuele feedback alleen.

---

## 📝 Success Criteria & Launch Checklist

### MVP Launch Criteria (Must Have)

- [x] ✅ SongStatusBadge component (DONE)
- [ ] Song cards show correct status badges
- [ ] Badge counter on Library tab
- [ ] Smart sorting: action items first
- [ ] LyricsChoiceModal with swipeable on mobile
- [ ] Clear "1/2, 2/2" indicators
- [ ] Studio redirects to Library after generation start
- [ ] No more blocking modals
- [ ] Toast notification on generation start
- [ ] Retry button for failed items
- [ ] All empty states implemented
- [ ] All 6 status states work correctly
- [ ] InstantDB subscription updates UI realtime
- [ ] Select variant → Start music generation
- [ ] Deep linking from notifications
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E test for complete flow passing

### Post-Launch Enhancements (Nice to Have)

- [ ] Pull-to-refresh on mobile
- [ ] Virtual scrolling for > 50 items
- [ ] Skeleton loaders
- [ ] Haptic feedback on swipe
- [ ] Long-press context menu
- [ ] Batch actions (select multiple, delete all)
- [ ] Export song as audio file
- [ ] Advanced filters (date range, mood, language)
- [ ] Search within lyrics text
- [ ] Playlist/collection feature

---

## 🔗 References & Related Documents

- **PRD-0014**: Async Background Generation with Push Notifications (backend implementation)
- **Task List 0014**: Detailed task breakdown for async generation
- **Design System**: `src/app/globals.css` (huisstijl colors and animations)
- **Current Library**: `src/app/library/page.tsx` (existing implementation)
- **InstantDB Schema**: `src/instant.schema.ts` (songs entity with new fields)
- **Suno API Docs**: `prompts/sunomanual.md` (lyrics and music generation)

---

## ✅ Approval & Sign-off

**Product Owner**: [TO BE SIGNED]
**Engineering Lead**: [TO BE SIGNED]
**Design Lead**: [TO BE SIGNED]
**Date**: [TO BE FILLED]

---

_Laatste update: 26 oktober 2025_
_Versie: 1.0 (Draft)_
_Eigenaar: Product & Engineering Team_
