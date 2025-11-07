# Designer Briefing - Library Page Redesign

## 📋 Overzicht

Deze map bevat drie uitgebreide documenten voor de Library page redesign:

### 1. **designer-briefing-library.md** (Hoofddocument)
Het complete design briefing document met:
- Huidige implementatie analyse
- Volledige datamodel beschrijving
- Gebruikersstromen
- Design requirements
- Success metrics
- Technical constraints

**Start hier!** Dit document geeft alle context die een designer nodig heeft.

### 2. **library-erd-diagram.md** (Database Model)
Entity Relationship Diagram en data structuren:
- Mermaid ERD diagram
- Visuele representatie van relaties
- JSON field structuren
- Status state machines
- Indexed fields reference

**Voor developers en designers** die de data structuur willen begrijpen.

### 3. **library-ui-mockup-concepts.md** (UI Concepten)
ASCII mockups van verschillende UI concepten:
- Concept A: Dashboard-First
- Concept B: Status-Grouped Grid
- Concept C: Timeline View
- Concept D: Kanban Board
- Gedetailleerde component mockups
- Modal designs
- Interactive elements
- Animation specs

**Voor visuele inspiratie** en concrete UI voorbeelden.

---

## 🎯 Doel van deze Redesign

De huidige Library page is functioneel maar mist:
- Duidelijke visuele hiërarchie
- Actie-gerichte UI (wat moet gebruiker doen?)
- Overzicht en dashboard functionaliteit
- Mobiel-geoptimaliseerde interacties
- Visuele progress indicators

**Gewenst resultaat:**
Een intuïtieve, overzichtelijke library waar gebruikers:
1. Snel zien wat actie vereist (lyrics kiezen, afspelen, retry)
2. Moeiteloos hun collectie kunnen beheren
3. Gesprekken kunnen hervatten
4. Liedjes kunnen delen en afspelen

---

## 📊 Belangrijkste Data Entities

### Songs
- Status flow: `pending → generating_lyrics → lyrics_ready → generating_music → ready → complete`
- **Actie vereist bij:** `lyrics_ready` (kies variant), `ready` (afspelen), `failed` (retry)
- Heeft meerdere variants (2-4 per song)
- Rijk aan metadata: timestamps, progress, errors

### Conversations
- Phases: `gathering → generating → refining → complete`
- Readiness score (0-100%)
- Bevat messages, concept lyrics, extracted context
- Kan hervatten worden in Studio

---

## 🎨 Design Prioriteiten

1. **Action-Oriented Design**
   - Items die actie vereisen zijn prominent
   - Clear CTAs met visuele urgentie
   - Quick actions zonder extra clicks

2. **Status Clarity**
   - Duidelijke badges per status
   - Progress bars voor genererende items
   - Error states met recovery opties

3. **Mobile-First**
   - Touch-friendly targets (44x44px min)
   - Swipe gestures
   - Bottom-sheet modals
   - Thumb zone optimalisatie

---

## 🔑 Key User Flows

### Flow 1: Lyrics Kiezen (HOOGSTE PRIORITEIT)
```
User ziet song met "lyrics_ready" status
  ↓
Clicks "KIES LYRICS" button
  ↓
Modal toont 2 variants side-by-side
  ↓
User selecteert favoriet
  ↓
Song → "generating_music"
  ↓
Push notification: "Je liedje is klaar!"
```

### Flow 2: Liedje Afspelen
```
User ziet song met "ready" status
  ↓
Clicks "▶ SPEEL AF"
  ↓
Mini player verschijnt onderaan
  ↓
Kan variant switchen
```

### Flow 3: Gefaald Liedje Retry
```
User ziet "failed" status met error
  ↓
Clicks "🔄 PROBEER OPNIEUW"
  ↓
Song → generating state
```

---

## 📱 Platform Specifics

### Mobile (Primary)
- Bottom navigation altijd zichtbaar
- Swipe gestures voor acties
- Pull-to-refresh
- Bottom sheets voor modals/filters
- Carousel voor actie items

### Desktop
- Multi-column grid (2-3 columns)
- Sidebar filters (persistent)
- Hover states met previews
- Keyboard shortcuts

---

## 🎨 Current Design System

**Colors:**
- Primary: Rose (#f43f5e)
- Success: Emerald (#10b981)
- Warning: Yellow (#eab308)
- Error: Red (#ef4444)

**Status Colors:**
- 🔴 URGENT: lyrics_ready, failed
- 🟢 READY: ready
- 🟡 BEZIG: generating_*
- ⚪ DONE: complete

**Typography:**
- System font stack
- Sizes: 12px, 14px, 16px, 18px, 24px
- Weights: 400, 600, 700

**Spacing:**
- Tailwind scale (0.25rem increments)
- Common gaps: 8px, 16px, 32px

---

## ✅ Design Deliverables Needed

1. **Page Layouts**
   - Dashboard view
   - Full songs grid
   - Full conversations grid
   - Empty states
   - Loading states

2. **Components**
   - Song cards (alle statussen)
   - Conversation cards (alle fases)
   - Status badges
   - Progress indicators
   - Filter/sort controls

3. **Modals**
   - Lyrics keuze modal (2-variant compare)
   - Song details sheet
   - Delete confirmation
   - Error messages

4. **Mobile Specific**
   - Swipe gesture states
   - Bottom sheets
   - FAB designs

5. **Responsive**
   - Mobile (320-768px)
   - Tablet (768-1024px)
   - Desktop (1024px+)

---

## 📈 Success Metrics

### Usability
- Time to lyrics selection: < 30s
- Clicks to play: 1 click
- Filter usage: > 40%

### Engagement
- Songs played per session: +50%
- Return rate: +30%
- Conversation resume: +40%

### Technical
- Page load: < 2s
- Cards/second: > 30
- Polling efficiency: < 100kb/min

---

## 🚫 Out of Scope

Deze features zijn NIET onderdeel van deze redesign:
- Project/folder organisatie
- Bulk acties
- Analytics dashboard
- Social features
- Export functionaliteit
- Music platform integration

---

## 📂 Codebase Referenties

- **Current Implementation:** `src/app/library/page.tsx`
- **Components:** `src/app/library/components/`
- **Queries:** `src/lib/library/queries.ts`
- **Schema:** `src/instant.schema.ts`
- **Types:** `src/types/generation.ts`, `src/types/conversation.ts`

---

## 🚀 Next Steps

1. ✅ **Designer Review** - Lees alle documenten door
2. **Questions** - Spar met team over onduidelijkheden
3. **Wireframes** - Low-fi layouts voor flow validatie
4. **Design System** - Extend bestaande component library
5. **High-Fidelity** - Pixel-perfect designs
6. **Prototype** - Interactive Figma/Framer prototype
7. **Handoff** - Specs, assets, documentatie

---

## 💬 Vragen?

Voor vragen over:
- **Data model** → Zie `library-erd-diagram.md`
- **UI concepten** → Zie `library-ui-mockup-concepts.md`
- **Requirements** → Zie `designer-briefing-library.md`
- **Code** → Bekijk de referenties in `src/app/library/`

**Development team is beschikbaar voor sparring!**

---

**Document Versie:** 1.0
**Laatste Update:** 2025-01-07
**Auteur:** Development Team
**Status:** Ready for Design Phase
