# PRD 0005: Template-Based Studio Workflow met Suno Lyrics Generatie

## Introduction/Overview

De huidige studio applicatie heeft een aantal kritieke pijnpunten die de gebruikerservaring belemmeren:
- **Gebrek aan controle**: Gebruikers weten niet hoe het eindresultaat gaat klinken
- **Lange wachttijd**: Het duurt 60+ seconden voordat gebruikers iets horen
- **Suboptimale lyrics**: De huidige LLM (DeepSeek) is niet geoptimaliseerd voor muziek-lyrics

Deze PRD beschrijft een complete herontwerp van de studio workflow die gebruikers **maximale controle** geeft over het eindresultaat, met een **voorspelbare template-based aanpak** en **native Suno lyrics generatie** voor betere resultaten.

### Doel
Een intuïtieve studio-ervaring creëren waar gebruikers:
1. **Vooraf weten** hoe hun liedje gaat klinken door template-selectie met voorbeelden
2. **Binnen 45 seconden** een eerste preview kunnen beluisteren
3. **Professionele lyrics** krijgen die geoptimaliseerd zijn voor muziek (via Suno's lyrics engine)
4. **Volledige controle** hebben over alle muzikale parameters

---

## Goals

1. **Gebruikerscontrole**: Gebruikers kunnen de stijl, sfeer, en vocale eigenschappen van hun liedje kiezen vóór generatie
2. **Voorspelbaarheid**: Templates met voorbeelden laten gebruikers exact horen wat ze kunnen verwachten
3. **Snelheid**: Eerste playback binnen 45 seconden via streaming URLs
4. **Kwaliteit**: Suno's native lyrics engine gebruiken voor betere, muziek-specifieke teksten
5. **Transparantie**: Duidelijke progress indicators en controle over het generatieproces
6. **Flexibiliteit**: "Verras me" optie voor gebruikers die een spontaan resultaat willen

---

## User Stories

### US-1: Template Selectie
**Als** gebruiker
**Wil ik** drie template-voorbeelden kunnen beluisteren (instrumental)
**Zodat** ik de stijl en sfeer kan kiezen die bij mijn liedje past

**Acceptatiecriteria:**
- Drie vaste templates zichtbaar in linker kolom bij het starten van studio
- Elke template heeft:
  - Een beschrijvende naam (bijv. "Romantische Ballad", "Moderne Pop", "Akoestisch Intiem")
  - Een korte beschrijving van de stijl/sfeer
  - Een afspelbare instrumental preview (~30 seconden)
  - Visuele indicatie welke template geselecteerd is
- Gebruiker kan templates afspelen zonder iets te genereren
- Geselecteerde template wordt gemarkeerd met visuele highlight

### US-2: "Verras Me" Optie
**Als** gebruiker
**Wil ik** kunnen kiezen voor "Verras me"
**Zodat** Suno alle creatieve beslissingen voor me neemt

**Acceptatiecriteria:**
- Vierde optie naast de drie templates: "✨ Verras me"
- Bij selectie wordt alle template-gebonden configuratie overgeslagen
- Suno krijgt maximale creatieve vrijheid (geen style constraints)
- Duidelijke uitleg dat het resultaat onvoorspelbaar is

### US-3: Conversational Context Gathering
**Als** gebruiker
**Wil ik** door een AI-chat worden uitgevraagd over mijn liedje
**Zodat** de AI genoeg context heeft om persoonlijke lyrics te genereren

**Acceptatiecriteria:**
- Chat interface in midden kolom
- AI stelt vragen over:
  - De persoon/relatie waar het liedje over gaat
  - Belangrijke herinneringen of momenten
  - Emoties en gevoelens
  - Gewenste toon/sfeer
- Rechter kolom toont real-time "Context Panel" met verzamelde informatie
- Context wordt gebruikt voor Suno lyrics prompt

### US-4: Suno Lyrics Generatie
**Als** gebruiker
**Wil ik** dat mijn lyrics worden gegenereerd door Suno's gespecialiseerde lyrics engine
**Zodat** de tekst muzikaal geoptimaliseerd is en goed werkt in het liedje

**Acceptatiecriteria:**
- Na voldoende context: transitie naar lyrics generatie
- Gebruik van Suno `/api/v1/lyrics` endpoint
- Alle verzamelde context wordt als prompt meegegeven
- Template-informatie (stijl, sfeer) wordt meegenomen in prompt
- Gegenereerde lyrics worden getoond in rechter paneel
- Lyrics zijn geformatteerd met verses, chorus, bridge etc.

### US-5: Lyrics Refinement via Suno
**Als** gebruiker
**Wil ik** feedback kunnen geven op de gegenereerde lyrics
**Zodat** Suno een nieuwe versie kan genereren die beter aansluit

**Acceptatiecriteria:**
- "Verfijn Lyrics" knop onder de gegenereerde lyrics
- Tekstinvoer voor feedback (bijv. "Maak de chorus vrolijker", "Voeg referentie toe aan ons eerste date")
- Feedback wordt toegevoegd aan Suno lyrics prompt
- Nieuwe lyrics worden gegenereerd via `/api/v1/lyrics` met verfijningsinstructies
- Gebruiker kan meerdere keren verfijnen

### US-6: Streaming URL First Playback
**Als** gebruiker
**Wil ik** de muziek zo snel mogelijk kunnen beluisteren
**Zodat** ik niet lang hoef te wachten op de volledige download

**Acceptatiecriteria:**
- Na klikken op "Genereer Muziek": modal met progress indicator
- Zodra streaming URL beschikbaar is (~30-40 seconden):
  - Modal toont variant selector
  - Elke variant heeft play knop (disabled tot streaming URL er is)
  - Zodra streaming URL beschikbaar: play knop wordt actief
  - Gebruiker kan beginnen met luisteren
- Download URL wordt later toegevoegd (2-3 minuten) zonder UI interruption
- Visuele indicatie wanneer download beschikbaar is

### US-7: Variant Selectie met Progressive Loading
**Als** gebruiker
**Wil ik** beide Suno-gegenereerde varianten kunnen beluisteren
**Zodat** ik de beste versie kan kiezen voor mijn liedje

**Acceptatiecriteria:**
- Modal toont 2 varianten naast elkaar
- Elke variant toont:
  - Albumhoes placeholder (of image URL als beschikbaar)
  - Titel
  - Play/pause knop (disabled tot streaming URL beschikbaar is)
  - Status indicator ("Laden...", "Klaar om af te spelen", "Download beschikbaar")
- Varianten verschijnen progressief:
  - Eerst variant 1 streaming URL → play knop actief
  - Dan variant 2 streaming URL → play knop actief
  - Later: download URLs worden toegevoegd
- Gebruiker kan beide afspelen en vergelijken
- "Kies deze" knop onder elke variant
- Geselecteerde variant wordt geladen in music player (rechter paneel)

### US-8: Advanced Controls (Optioneel)
**Als** ervaren gebruiker
**Wil ik** toegang tot geavanceerde parameters
**Zodat** ik fijnmazige controle heb over het generatieproces

**Acceptatiecriteria:**
- "Geavanceerde Opties" toggle (standaard uitgeschakeld)
- Bij activeren worden extra controls zichtbaar:
  - **Vocal Gender**: 'm' (mannelijk) | 'f' (vrouwelijk) | 'neutral' (auto)
  - **Style Weight**: Slider 0-100% (hoeveel invloed heeft de style tag)
  - **Weirdness Constraint**: Slider 0-100% (experimenteel vs veilig)
  - **Audio Weight**: Slider 0-100% (audio vs lyrics focus)
  - **Negative Tags**: Tekstinvoer (wat NIET in het liedje moet)
  - **Model**: Dropdown (V4, V4_5, V4_5PLUS, V5)
- Default waarden worden bepaald door geselecteerde template
- Tooltips bij elke parameter met uitleg
- Wijzigingen overschrijven template defaults

### US-9: Timestamped Lyrics (Karaoke Mode)
**Als** gebruiker
**Wil ik** de lyrics zien tijdens het afspelen, gesynchroniseerd met de muziek
**Zodat** ik kan meezingen of de tekst beter kan volgen

**Acceptatiecriteria:**
- "Toon Karaoke Lyrics" toggle bij music player
- Bij activeren: lyrics panel toont tekst met timestamps
- Tijdens playback:
  - Huidige regel wordt ge-highlight
  - Auto-scroll volgt de muziek
  - Visuele feedback (kleurverandering, bold) van actieve tekst
- Gebruikt Suno `/api/v1/lyrics/timestamped` endpoint
- Fallback naar niet-gesynchroniseerde lyrics als timestamps niet beschikbaar zijn

### US-10: Error Handling met Recovery Options
**Als** gebruiker
**Wil ik** duidelijke feedback krijgen als iets misgaat
**Zodat** ik weet wat ik kan doen om verder te gaan

**Acceptatiecriteria:**
- Bij Suno API errors:
  - Gebruiksvriendelijke Nederlandse foutmelding (geen technische details)
  - "Probeer opnieuw" knop
  - "Pas Lyrics Aan" knop (misschien helpt andere tekst)
  - Optie om terug te gaan naar chat voor meer context
- Bij timeout (>120 seconden):
  - Melding "Generatie duurt langer dan verwacht"
  - Optie om door te blijven wachten
  - Optie om te annuleren en opnieuw te proberen
- Bij rate limiting:
  - Duidelijke uitleg over limiet
  - Geschatte wachttijd
  - Automatische retry na wachttijd

---

## Functional Requirements

### FR-1: Template System
**1.1** Systeem toont drie vooraf gedefinieerde templates bij het starten van studio
**1.2** Elke template bevat:
- Instrumental preview audio (gegenereerd via Suno, opgeslagen in project)
- Naam, beschrijving, genre tags
- Vooraf gedefinieerde Suno parameters (`style`, `tags`, `model`, `styleWeight`, etc.)

**1.3** Gebruiker kan template selecteren door erop te klikken
**1.4** Geselecteerde template wordt visueel gemarkeerd
**1.5** Vierde optie "Verras me" is beschikbaar, wat alle template constraints verwijdert

**Implementatie Details:**
- Templates worden opgeslagen in `/templates/music-templates.ts` als TypeScript configuratie
- Preview audio bestanden worden gehost in `/public/templates/`
- Template configuratie bevat:
```typescript
interface MusicTemplate {
  id: string;
  name: string;
  description: string;
  previewAudioUrl: string;
  imageUrl: string;
  sunoConfig: {
    style: string;
    tags: string;
    model: 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';
    styleWeight?: number;
    weirdnessConstraint?: number;
    audioWeight?: number;
  };
}
```

### FR-2: Conversational Context Gathering
**2.1** Chat interface gebruikt bestaande two-agent conversation system
**2.2** Verzamelde context wordt real-time getoond in rechter paneel
**2.3** Context bevat: memories, emotions, partnerTraits, language, mood
**2.4** Readiness score bepaalt wanneer genoeg context is verzameld
**2.5** Bij readiness score ≥ 70% OF user trigger: transitie naar lyrics generatie

### FR-3: Suno Lyrics Generation
**3.1** Systeem roept `/api/v1/lyrics` endpoint aan met:
- `prompt`: Gecombineerde chat context + template stijl informatie
- `callBackUrl`: Voor async resultaat ontvangst (optioneel, polling is ook mogelijk)

**3.2** Prompt formatting:
```
Schrijf lyrics voor een ${templateName} liefdesliedje.

Context:
- Voor: ${partnerName}
- Herinneringen: ${memories.join(', ')}
- Emoties: ${emotions.join(', ')}
- Eigenschappen partner: ${traits.join(', ')}
- Taal: ${language}
- Sfeer: ${mood.join(', ')}

Stijl: ${template.sunoConfig.style}
Genre: ${template.sunoConfig.tags}

Genereer lyrics met duidelijke verse/chorus/bridge structuur.
```

**3.3** Response wordt geparsed en getoond in rechter paneel
**3.4** Lyrics worden opgeslagen in InstantDB onder conversation
**3.5** "Genereer Muziek" knop wordt actief na succesvolle lyrics generatie

### FR-4: Lyrics Refinement
**4.1** "Verfijn Lyrics" knop onder gegenereerde lyrics
**4.2** Tekstinvoer voor gebruikersfeedback
**4.3** Bij klikken op "Verfijn":
- Nieuwe aanroep naar `/api/v1/lyrics` met:
  - Originele prompt + vorige lyrics + gebruikersfeedback
  - Instructie: "Verbeter de vorige lyrics op basis van deze feedback: {feedback}"

**4.4** Nieuwe lyrics vervangen oude in UI
**4.5** Lyrics versie geschiedenis wordt bijgehouden (via bestaand lyricVersions systeem)

### FR-5: Music Generation met Template Context
**5.1** Bij klikken "Genereer Muziek":
- Lyrics uit stap FR-3 of FR-4
- Template configuratie (indien geselecteerd)
- Aanroep naar `/api/v1/generate` met:
  ```json
  {
    "custom_mode": true,
    "prompt": "<lyrics>",
    "title": "<song title>",
    "tags": "<template.sunoConfig.tags>",
    "model": "<template.sunoConfig.model>",
    "styleWeight": "<template.sunoConfig.styleWeight>",
    "weirdnessConstraint": "<template.sunoConfig.weirdnessConstraint>",
    "audioWeight": "<template.sunoConfig.audioWeight>",
    "vocalGender": "<user preference>",
    "negativeTags": "<user input>",
    "callBackUrl": "<callback endpoint>"
  }
  ```

**5.2** Response bevat `task_id` die wordt opgeslagen voor polling/callback
**5.3** Song entity wordt aangemaakt in InstantDB met status 'generating'
**5.4** Progress modal wordt getoond

### FR-6: Progressive Loading van Variants
**6.1** Variant selector modal toont 2 placeholders voor Suno's 2 tracks
**6.2** Callback handler `/api/suno/callback` ontvangt updates:
- `callbackType: 'first'`: Eerste streaming URL beschikbaar
- `callbackType: 'complete'`: Alle URLs beschikbaar

**6.3** UI update flow:
```
Initial state:
- Variant 1: [Laden...] 🔒 (disabled play button)
- Variant 2: [Laden...] 🔒 (disabled play button)

After 'first' callback (track 0 streaming URL):
- Variant 1: [Klaar] ▶️ (active play button)
- Variant 2: [Laden...] 🔒 (disabled play button)

After 'first' callback (track 1 streaming URL):
- Variant 1: [Klaar] ▶️ (active play button)
- Variant 2: [Klaar] ▶️ (active play button)

After 'complete' callback:
- Variant 1: [Download beschikbaar] ⬇️ ▶️
- Variant 2: [Download beschikbaar] ⬇️ ▶️
```

**6.4** InstantDB subscription (`db.useQuery`) detecteert wijzigingen in `sunoVariants` entiteiten
**6.5** UI re-rendert automatisch bij nieuwe URLs

### FR-7: Fallback Polling Mechanisme
**7.1** Als callback niet arriveert binnen 10 seconden: start polling
**7.2** Poll `/api/v1/generate/record-info?taskId={taskId}` elke 5 seconden
**7.3** Parse response voor `stream_audio_url` en `audio_url`
**7.4** Update InstantDB met nieuwe URLs
**7.5** Stop polling bij status 'complete' of na 120 seconden timeout
**7.6** Timeout toont error met recovery opties

### FR-8: Variant Selection & Music Player
**8.1** Bij klikken "Kies deze" op een variant:
- Modal sluit
- Geselecteerde variant wordt geladen in music player (rechter paneel)
- Variant ID wordt opgeslagen in `selectedVariantId` state

**8.2** Music player toont:
- Album art (variant.imageUrl)
- Titel
- Playback controls (bestaande MusicPlayer component)
- Download knop (als audioUrl beschikbaar)
- Share knop

### FR-9: Advanced Controls Panel
**9.1** Toggle "Geavanceerde Opties" (standaard uit)
**9.2** Bij activeren: extra controls panel wordt zichtbaar met:
- Vocal Gender: Radio buttons (m/f/neutral)
- Style Weight: Range slider (0-100, stap 1)
- Weirdness Constraint: Range slider (0-100, stap 1)
- Audio Weight: Range slider (0-100, stap 1)
- Negative Tags: Text input (multi-line)
- Model: Dropdown (V4, V4_5, V4_5PLUS, V5)

**9.3** Default waarden komen van geselecteerde template
**9.4** Wijzigingen overschrijven template defaults
**9.5** Tooltips met Nederlandse uitleg bij elke parameter

### FR-10: Timestamped Lyrics (Karaoke)
**10.1** Toggle "Karaoke Modus" bij music player
**10.2** Bij activeren:
- Roep `/api/v1/lyrics/timestamped` aan met `taskId` en `audioId`
- Parse response voor timestamps array

**10.3** Tijdens playback:
- Synchroniseer lyrics highlight met audio positie
- Auto-scroll naar huidige regel
- Visuele feedback: huidige regel in bold/kleur

**10.4** Fallback: Als timestamped endpoint faalt, toon niet-gesynchroniseerde lyrics

### FR-11: Error Handling & Recovery
**11.1** Bij Suno API errors (status 400/500):
- Parse error message uit response
- Toon Nederlandse vertaling in error modal
- Bied "Probeer Opnieuw" en "Pas Lyrics Aan" knoppen

**11.2** Bij rate limiting (status 429):
- Toon "Je hebt je limiet bereikt"
- Parse retry-after header (indien beschikbaar)
- Bied automatische retry na wachttijd

**11.3** Bij timeout (120s polling zonder resultaat):
- Toon "Generatie duurt langer dan verwacht"
- Optie: "Blijf wachten" (continue polling)
- Optie: "Annuleer en probeer opnieuw"

**11.4** Bij netwerk fouten:
- Toon "Verbindingsprobleem"
- Automatische retry (max 3x) met exponential backoff
- Daarna: handmatige retry optie

---

## Non-Goals (Out of Scope)

**NG-1** Extend/Cover/Upload functionaliteit (alleen basis generatie)
**NG-2** Stem separation / Instrumental extraction (alleen complete tracks)
**NG-3** Social media integratie / delen functionaliteit (alleen download)
**NG-4** Gebruiker credits management / betalingen
**NG-5** Collaborative features (meerdere gebruikers aan één liedje)
**NG-6** Mobile app (alleen web interface)
**NG-7** Custom template creation door gebruikers (alleen vooraf gedefinieerde templates)
**NG-8** AI voice cloning / custom vocal samples
**NG-9** Video generatie (alleen audio + album art)
**NG-10** Multi-language lyrics binnen één liedje

---

## Design Considerations

### UI/UX Layout (3-Column Design)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Studio Header                                 │
│  💕 Liefdesliedje Studio  |  [User Menu]  |  [Settings]             │
└─────────────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────┬───────────────────────────┐
│              │                          │                           │
│  TEMPLATES   │      CHAT INTERFACE      │    LYRICS & CONTROLS      │
│   (Links)    │        (Midden)          │       (Rechts)            │
│              │                          │                           │
│ ┌──────────┐ │  ┌────────────────────┐  │  ┌─────────────────────┐  │
│ │Template 1│ │  │  Chat Messages     │  │  │  Context Panel      │  │
│ │[Preview] │ │  │  (Conversation)    │  │  │  (During gathering) │  │
│ │▶️ Play   │ │  │                    │  │  │  - Memories         │  │
│ └──────────┘ │  │                    │  │  │  - Emotions         │  │
│              │  │                    │  │  │  - Traits           │  │
│ ┌──────────┐ │  │                    │  │  └─────────────────────┘  │
│ │Template 2│ │  │                    │  │                           │
│ │[Preview] │ │  │                    │  │  ┌─────────────────────┐  │
│ │▶️ Play   │ │  └────────────────────┘  │  │  Generated Lyrics   │  │
│ └──────────┘ │                          │  │  (After generation) │  │
│              │  ┌────────────────────┐  │  │                     │  │
│ ┌──────────┐ │  │  Input Field       │  │  │  [Verse 1]         │  │
│ │Template 3│ │  │  [Verstuur]        │  │  │  [Chorus]          │  │
│ │[Preview] │ │  └────────────────────┘  │  │  [Verse 2]         │  │
│ │▶️ Play   │ │                          │  │  ...                │  │
│ └──────────┘ │  ┌────────────────────┐  │  │                     │  │
│              │  │  Composer Controls │  │  │  [Verfijn Lyrics]  │  │
│ ┌──────────┐ │  │  (Suggestions)     │  │  │  [Genereer Muziek] │  │
│ │✨ Verras │ │  └────────────────────┘  │  └─────────────────────┘  │
│ │   Me!    │ │                          │                           │
│ └──────────┘ │                          │  ┌─────────────────────┐  │
│              │                          │  │  Music Player       │  │
│              │                          │  │  (After selection)  │  │
│              │                          │  │  🎵 [Album Art]    │  │
│              │                          │  │  ▶️ ⏸️ ⏭️           │  │
│              │                          │  │  🔊 ━━━━━━━━━━━     │  │
│              │                          │  │  [Download] [Share]│  │
│              │                          │  └─────────────────────┘  │
└──────────────┴──────────────────────────┴───────────────────────────┘
```

### Component Hierarchy

```
StudioPage (src/app/studio/page.tsx)
├── ConversationalStudioLayout
│   ├── TemplateSelector (NEW - left pane)
│   │   ├── TemplateCard (x3)
│   │   │   ├── TemplateName
│   │   │   ├── TemplateDescription
│   │   │   ├── AudioPreview (mini player)
│   │   │   └── SelectButton
│   │   └── SurpriseMeCard
│   │
│   ├── ChatInterface (middle pane - existing)
│   │   ├── MessageList
│   │   ├── InputArea
│   │   └── ComposerControls
│   │
│   └── LyricsPanel (right pane - existing, enhanced)
│       ├── ContextPanel (during gathering phase)
│       ├── GeneratedLyrics (after lyrics generation)
│       ├── LyricsRefinementForm
│       ├── AdvancedControlsPanel (NEW - toggleable)
│       └── MusicPlayer (after variant selection)
│
├── MusicGenerationProgress (modal overlay - existing)
│
├── VariantSelector (NEW - modal overlay)
│   ├── VariantCard (x2)
│   │   ├── AlbumArt
│   │   ├── MiniPlayer (progressive loading)
│   │   ├── StatusIndicator ("Laden", "Klaar", "Download beschikbaar")
│   │   └── SelectButton
│   └── CloseButton
│
└── ErrorModal (NEW)
    ├── ErrorMessage
    ├── RetryButton
    ├── AdjustLyricsButton
    └── BackToChatButton
```

### Data Flow Diagram

```
[User] → [Template Selection]
           ↓
       [Template Config Stored]
           ↓
[User] → [Chat Conversation] → [Context Extraction]
           ↓                         ↓
       [Readiness Check]      [Context Panel Update]
           ↓
       [Transition to Lyrics Generation]
           ↓
       [Suno /api/v1/lyrics]
           ↓
       [Lyrics Displayed] → [User Approves/Refines]
           ↓                         ↓
       [Generate Music]        [Suno /api/v1/lyrics with feedback]
           ↓                         ↓
       [Suno /api/v1/generate]  [New Lyrics Displayed]
           ↓
       [task_id returned]
           ↓
       [Progress Modal]
           ↓
       ┌───────────────────────┐
       │  Parallel Processes:  │
       ├───────────────────────┤
       │ 1. Callback Listener  │ → [Stream URL received] → [Update DB]
       │ 2. Fallback Polling   │ → [Check status]        → [Update DB]
       └───────────────────────┘
           ↓
       [InstantDB Subscription Detects Changes]
           ↓
       [Variant Selector Modal]
           ↓
       [User Selects Variant]
           ↓
       [Music Player Loaded]
           ↓
       [Optional: Karaoke Mode]
           ↓
       [Suno /api/v1/lyrics/timestamped]
           ↓
       [Synchronized Lyrics Display]
```

### Color Palette & Styling

Gebruik bestaande pink/romantic theme:
- **Primary**: Pink-500 (#EC4899)
- **Hover**: Pink-600 (#DB2777)
- **Disabled**: Gray-300 (#D1D5DB)
- **Background**: Gray-50 (#F9FAFB)
- **Text**: Gray-800 (#1F2937)
- **Success**: Green-500 (#10B981)
- **Error**: Red-500 (#EF4444)
- **Loading**: Pink-200 (#FBCFE8)

---

## Technical Considerations

### API Integration

**Suno API Endpoints:**
1. `/api/v1/lyrics` - Generate lyrics (NEW)
2. `/api/v1/generate` - Generate music (existing, enhanced)
3. `/api/v1/generate/record-info` - Poll status (existing)
4. `/api/v1/lyrics/timestamped` - Get karaoke timestamps (NEW)

**Request Flow:**
```typescript
// 1. Generate Lyrics
POST /api/v1/lyrics
{
  "prompt": "Schrijf lyrics voor een romantische ballad...",
  "callBackUrl": "https://yourapp.com/api/suno/lyrics-callback" // optioneel
}
→ Response: { task_id, status: 'generating' }

// 2. Poll/Callback for Lyrics
GET /api/v1/get-lyrics-generation-details?task_id={taskId}
→ Response: { status: 'SUCCESS', data: { lyrics: "..." } }

// 3. Generate Music with Lyrics
POST /api/v1/generate
{
  "custom_mode": true,
  "prompt": "<generated lyrics>",
  "title": "Mijn Liefdesliedje",
  "tags": "romantic, ballad, dutch",
  "model": "V5",
  "vocalGender": "m",
  "styleWeight": 0.8,
  "callBackUrl": "https://yourapp.com/api/suno/callback?songId={songId}"
}
→ Response: { task_id, status: 'generating' }

// 4. Receive Callbacks
POST /api/suno/callback?songId={songId}
{
  "callbackType": "first", // of "complete"
  "task_id": "...",
  "data": [
    {
      "id": "track-1",
      "stream_audio_url": "https://...",  // beschikbaar na ~30-40s
      "audio_url": "https://...",         // beschikbaar na ~2-3 min
      "image_url": "https://...",
      "title": "...",
      "duration": 180
    },
    {
      "id": "track-2",
      ...
    }
  ]
}

// 5. Get Timestamped Lyrics (for karaoke)
POST /api/v1/lyrics/timestamped
{
  "taskId": "{music_task_id}",
  "audioId": "{track_id}"
}
→ Response: {
  lyrics: [
    { text: "Verse 1 line", start: 5.2, end: 8.1 },
    { text: "Chorus line", start: 8.5, end: 12.3 },
    ...
  ]
}
```

### Database Schema Updates

**New Table: `musicTemplates`**
```typescript
// instant.schema.ts
const schema = i.schema({
  entities: {
    // ... existing entities

    musicTemplates: i.entity({
      id: i.string().indexed(),
      name: i.string(),
      description: i.string(),
      previewAudioUrl: i.string(),
      imageUrl: i.string(),
      sunoConfig: i.json(), // stores template configuration
      createdAt: i.number().indexed(),
      isActive: i.boolean().indexed(), // for enabling/disabling templates
    }),
  },

  links: {
    // ... existing links

    // No links needed for templates (static data)
  },
});
```

**Updated `songs` entity:**
```typescript
songs: i.entity({
  // ... existing fields
  templateId: i.string().optional(), // reference to selected template
  lyricsTaskId: i.string().optional(), // Suno lyrics generation task ID
  musicTaskId: i.string(), // Suno music generation task ID (existing: sunoTaskId)
  hasTimestampedLyrics: i.boolean(), // flag for karaoke availability
}),
```

**Updated `sunoVariants` entity:**
```typescript
sunoVariants: i.entity({
  // ... existing fields
  streamAudioUrl: i.string().optional(), // NEW: streaming URL (arrives first)
  audioUrl: i.string().optional(), // download URL (arrives later)
  streamAvailableAt: i.number().optional(), // timestamp when stream became available
  downloadAvailableAt: i.number().optional(), // timestamp when download became available
}),
```

### Environment Variables

```bash
# Existing
SUNO_API_KEY=sk-xxx
SUNO_CALLBACK_URL=https://your-domain.com/api/suno/callback

# New (optional)
NEXT_PUBLIC_ENABLE_KARAOKE=true
NEXT_PUBLIC_ENABLE_ADVANCED_CONTROLS=true
NEXT_PUBLIC_DEFAULT_MUSIC_MODEL=V5
```

### API Routes to Create/Update

**New Routes:**
1. `/api/suno/lyrics` - POST - Generate lyrics via Suno
2. `/api/suno/lyrics/callback` - POST - Receive lyrics callback
3. `/api/suno/lyrics-timestamped` - POST - Fetch karaoke timestamps

**Updated Routes:**
1. `/api/suno/route.ts` - Enhance POST to accept template config
2. `/api/suno/callback/route.ts` - Handle progressive loading (first vs complete callbacks)

### State Management

```typescript
// StudioPage state additions
const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
const [templateConfig, setTemplateConfig] = useState<MusicTemplate['sunoConfig'] | null>(null);
const [lyricsTaskId, setLyricsTaskId] = useState<string | null>(null);
const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
const [advancedControlsEnabled, setAdvancedControlsEnabled] = useState(false);
const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
  vocalGender: 'neutral',
  styleWeight: 0.8,
  weirdnessConstraint: 0.5,
  audioWeight: 0.5,
  negativeTags: '',
  model: 'V5',
});
const [karaokeMode, setKaraokeMode] = useState(false);
const [timestampedLyrics, setTimestampedLyrics] = useState<TimestampedLyric[] | null>(null);
```

### Performance Considerations

1. **Template Previews**: Pre-generate en host in CDN/Vercel Edge voor snelle load times
2. **Callback vs Polling**: Gebruik callbacks als primary, polling als fallback
3. **InstantDB Subscriptions**: Alleen subscriben op active song, niet alle songs
4. **Streaming URLs**: Altijd eerst streaming URL gebruiken, download URL is optioneel
5. **Image Optimization**: Gebruik Next.js Image component voor album art
6. **Lazy Loading**: Lyrics panel components pas laden als nodig

### Security Considerations

1. **API Keys**: Suno API key alleen server-side (NEVER client-side)
2. **Callback Verification**: Verificeer Suno callback signature (indien beschikbaar)
3. **Rate Limiting**: Implementeer rate limiting op client-side om abuse te voorkomen
4. **Input Sanitization**: Sanitize user input voor lyrics feedback en advanced controls
5. **CORS**: Callback URL moet publicly accessible zijn, maar secured met query param validation

---

## Success Metrics

### Primary Metric
**Time to First Playback**: < 45 seconden (vanaf klikken "Genereer Muziek" tot eerste audio playback)

**Measurement:**
```typescript
const startTime = Date.now();
// ... music generation starts
const firstPlaybackTime = Date.now() - startTime;

// Track in analytics
analytics.track('music_generation_performance', {
  timeToFirstPlayback: firstPlaybackTime,
  targetMet: firstPlaybackTime < 45000,
});
```

### Secondary Metrics

**1. User Satisfaction with First Generation**
- Percentage gebruikers dat geen refinement nodig heeft
- Target: >60% tevreden met eerste versie

**2. Template Usage**
- Percentage gebruikers dat een template selecteert vs "Verras me"
- Target: >70% gebruikt templates (shows templates add value)

**3. Lyrics Refinement Rate**
- Gemiddeld aantal refinements per liedje
- Target: <2 refinements (shows Suno lyrics are good quality)

**4. Variant Selection Distribution**
- Welke variant wordt vaker gekozen (variant 1 vs 2)
- Target: ~50/50 (shows both are good quality)

**5. Advanced Controls Usage**
- Percentage gebruikers dat advanced controls activeert
- Target: 10-20% (niche feature for power users)

**6. Karaoke Mode Usage**
- Percentage gebruikers dat karaoke mode activeert
- Target: >30% (if higher, consider making it default)

**7. Error Recovery Rate**
- Percentage gebruikers dat na error recovery succesvol een liedje genereert
- Target: >80% (shows recovery options work)

### Analytics Events to Track

```typescript
// Template selection
analytics.track('template_selected', {
  templateId: 'romantic-ballad',
  templateName: 'Romantische Ballad',
});

// Lyrics generation
analytics.track('lyrics_generation_started', {
  conversationRounds: 6,
  readinessScore: 0.85,
});

analytics.track('lyrics_generation_completed', {
  duration: 12000, // ms
  lyricsLength: 450, // characters
});

// Lyrics refinement
analytics.track('lyrics_refinement_requested', {
  refinementNumber: 1,
  feedbackLength: 50,
});

// Music generation
analytics.track('music_generation_started', {
  templateId: 'romantic-ballad',
  advancedControlsUsed: false,
});

analytics.track('music_generation_first_playback', {
  timeToFirstPlayback: 38000, // ms - PRIMARY METRIC
  callbackReceived: true,
  pollingUsed: false,
});

analytics.track('music_generation_completed', {
  totalDuration: 120000, // ms
  variantsCount: 2,
});

// Variant selection
analytics.track('variant_selected', {
  variantIndex: 0, // 0 or 1
  streamPlayedBeforeSelection: true,
});

// Advanced controls
analytics.track('advanced_controls_enabled');
analytics.track('advanced_setting_changed', {
  setting: 'vocalGender',
  value: 'm',
});

// Karaoke mode
analytics.track('karaoke_mode_enabled');

// Errors
analytics.track('error_encountered', {
  errorType: 'timeout',
  stage: 'music_generation',
  recoveryAction: 'retry',
});
```

---

## Open Questions

### Q1: Template Creation Process
**Question**: Hoe gaan we de drie template voorbeelden creëren?
**Options:**
- A) Handmatig: Developer genereert 3 goede voorbeelden via Suno en host ze
- B) Automated: Script dat automatisch template voorbeelden genereert bij deployment
- C) User-generated: Laat community voorbeelden uploaden (future feature)

**Recommendation**: Start met A (handmatig), move to B later voor schaalbaarheid

### Q2: Suno Lyrics + Music Context Sharing
**Question**: Kan Suno de context delen tussen lyrics generatie en music generatie?
**Research Needed:**
- Is er een task_id of session_id die we kunnen doorgeven aan `/api/v1/generate`?
- Of moeten we alle context opnieuw in de music prompt stoppen?

**Fallback**: Als er geen native context sharing is, voeg lyrics task context toe aan music generation prompt:
```
Prompt: "<lyrics>\n\nGenerated with task: {lyricsTaskId}"
```

### Q3: Callback Reliability
**Question**: Hoe betrouwbaar zijn Suno callbacks in productie?
**Risk Mitigation:**
- Implementeer robust polling als fallback
- Monitor callback success rate in production
- Mogelijk hybrid approach: Always poll, maar stop bij callback arrival

### Q4: Timestamped Lyrics Availability
**Question**: Voor welke modellen/tracks zijn timestamped lyrics beschikbaar?
**Research Needed:**
- Zijn timestamps altijd beschikbaar, of alleen voor bepaalde models (V4.5+)?
- Wat is de fallback UX als timestamps niet beschikbaar zijn?

**Recommendation**: Maak karaoke mode graceful fallback → show static lyrics als timestamps niet beschikbaar

### Q5: Template Count & Variety
**Question**: Zijn drie templates voldoende, of willen we meer variatie?
**User Feedback Needed**: Test met beta users of drie templates genoeg dekking geeft

**Possible Templates:**
1. "Romantische Ballad" (slow, piano, emotional)
2. "Vrolijke Pop" (upbeat, catchy, modern)
3. "Akoestisch Intiem" (guitar, soft, personal)
4. Future: "Verras me" (random)

### Q6: Mobile Responsiveness
**Question**: Hoe werkt de 3-column layout op mobile devices?
**Options:**
- A) Stack vertically: Templates → Chat → Lyrics (scrolling)
- B) Tabbed interface: [Templates] [Chat] [Lyrics] tabs
- C) Mobile-first redesign (out of scope for MVP)

**Recommendation**: Start met B (tabs) voor MVP, A is fallback

### Q7: Credits & Rate Limiting
**Question**: Hoe communiceren we Suno API credits/limits naar gebruikers?
**Options:**
- A) Show remaining credits in UI (requires `/api/v1/get-credits` integration)
- B) Only show error when limit reached
- C) Pre-purchase credit packs (out of scope)

**Recommendation**: Start met B (reactive), move to A later for better UX

### Q8: Template Update Strategy
**Question**: Hoe updaten we templates als we betere voorbeelden willen?
**Options:**
- A) Manual: Update files in `/public/templates/` and config
- B) CMS: Admin panel to manage templates (future)
- C) Versioning: Keep old templates, add new ones (avoid breaking changes)

**Recommendation**: Start met A, plan for C (versioning) to avoid breaking user expectations

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Template selection en Suno lyrics generation

**Tasks:**
- [ ] Create `MusicTemplate` TypeScript interface
- [ ] Create 3 template configurations in `/templates/music-templates.ts`
- [ ] Generate 3 template preview audio files via Suno (manual)
- [ ] Create `TemplateSelector` component (left pane)
- [ ] Create `/api/suno/lyrics` endpoint (POST - generate lyrics)
- [ ] Create `/api/suno/lyrics/callback` endpoint (POST - receive callback)
- [ ] Update `LyricsPanel` to show generated lyrics from Suno
- [ ] Update state management for template selection
- [ ] Test end-to-end: Template select → Chat → Suno lyrics generation

**Deliverable**: Gebruiker kan template kiezen en Suno-gegenereerde lyrics zien

### Phase 2: Music Generation Enhancement (Week 2)
**Goal**: Template-based music generation met progressive loading

**Tasks:**
- [ ] Update `/api/suno` POST endpoint to accept template config
- [ ] Enhance callback handler to distinguish `first` vs `complete` callbacks
- [ ] Create `VariantSelector` component (modal)
- [ ] Implement progressive loading logic (streaming URL → download URL)
- [ ] Update InstantDB schema: add `streamAudioUrl` to `sunoVariants`
- [ ] Create polling fallback mechanism (10s delay, 5s interval, 120s timeout)
- [ ] Update `MusicGenerationProgress` component for better UX
- [ ] Test end-to-end: Lyrics → Generate → Streaming playback → Variant selection

**Deliverable**: Gebruiker kan binnen 45 seconden eerste preview beluisteren

### Phase 3: Advanced Controls & Refinement (Week 3)
**Goal**: Lyrics refinement en geavanceerde parameters

**Tasks:**
- [ ] Create `AdvancedControlsPanel` component (toggleable)
- [ ] Implement lyrics refinement flow (feedback → Suno `/api/v1/lyrics` call)
- [ ] Add advanced parameter inputs (vocal gender, style weight, etc.)
- [ ] Create tooltip system with Nederlandse uitleg
- [ ] Implement "Verras me" template (minimal constraints)
- [ ] Update music generation to merge template config + user overrides
- [ ] Test: Refine lyrics → Generate → Advanced controls → Generate

**Deliverable**: Power users kunnen volledige controle over generatie

### Phase 4: Karaoke & Polish (Week 4)
**Goal**: Timestamped lyrics en error handling

**Tasks:**
- [ ] Create `/api/suno/lyrics-timestamped` endpoint
- [ ] Implement karaoke mode in `MusicPlayer` component
- [ ] Create synchronized lyrics display with auto-scroll
- [ ] Create `ErrorModal` component with recovery options
- [ ] Implement comprehensive error handling (timeout, API errors, network errors)
- [ ] Add success metrics tracking (analytics events)
- [ ] Polish UI/UX (animations, loading states, tooltips)
- [ ] Comprehensive testing (all flows, error scenarios)

**Deliverable**: Production-ready studio met karaoke en robust error handling

### Phase 5: Testing & Optimization (Week 5)
**Goal**: Performance optimization en user testing

**Tasks:**
- [ ] Performance audit (Lighthouse, Core Web Vitals)
- [ ] Optimize template preview loading (CDN, compression)
- [ ] Beta user testing (collect feedback)
- [ ] A/B test: Template selection vs "Verras me" usage
- [ ] Monitor success metrics (time to first playback, satisfaction)
- [ ] Bug fixes based on user feedback
- [ ] Documentation updates

**Deliverable**: Optimized studio ready for production launch

---

## Dependencies

### External APIs
- **Suno API**: All endpoints must be functional and documented
  - `/api/v1/lyrics` - Lyrics generation
  - `/api/v1/generate` - Music generation
  - `/api/v1/generate/record-info` - Status polling
  - `/api/v1/lyrics/timestamped` - Karaoke timestamps
- **Suno Webhooks**: Callback URLs must be publicly accessible (ngrok for dev)

### Internal Systems
- **InstantDB**: Schema updates must be applied
- **Two-Agent Conversation System**: Must be functional (existing system)
- **Music Player Component**: Must support streaming URLs (existing)

### Technical Requirements
- **Node.js**: v18+ (for fetch API)
- **Next.js**: v15 (existing)
- **React**: v19 (existing)
- **TypeScript**: v5 (existing)

### Environment Setup
- **Suno API Key**: Must be configured in `.env`
- **Callback URL**: Must be publicly accessible (production) or ngrok (dev)
- **InstantDB**: Schema push must be successful

---

## Testing Strategy

### Unit Tests
- [ ] `MusicTemplate` configuration parsing
- [ ] Lyrics prompt formatting logic
- [ ] Advanced controls validation (ranges, required fields)
- [ ] Callback response parsing
- [ ] Error message translations

### Integration Tests
- [ ] Template selection → State update → API call
- [ ] Suno lyrics generation flow (mock API)
- [ ] Music generation with template config (mock API)
- [ ] Callback handling → InstantDB update → UI refresh
- [ ] Polling fallback mechanism

### E2E Tests (Playwright/Cypress)
- [ ] **Happy Path**: Template select → Chat → Lyrics → Generate → Play
- [ ] **Refinement Flow**: Generate lyrics → Refine → Generate music
- [ ] **Advanced Controls**: Enable advanced → Modify settings → Generate
- [ ] **Variant Selection**: Wait for variants → Preview → Select → Play
- [ ] **Karaoke Mode**: Play music → Enable karaoke → Verify sync
- [ ] **Error Recovery**: Force error → Verify modal → Retry → Success
- [ ] **"Verras Me" Flow**: Select surprise → Generate → Verify randomness

### Manual QA Checklist
- [ ] All 3 templates play correct preview audio
- [ ] "Verras me" produces varied results across multiple generations
- [ ] Streaming URL plays within 45 seconds (95% of the time)
- [ ] Both variants are playable and comparable
- [ ] Lyrics refinement produces different output
- [ ] Advanced controls affect music output (verifiable in metadata)
- [ ] Karaoke mode syncs correctly (within 500ms accuracy)
- [ ] Error messages are in correct Dutch
- [ ] Mobile layout is usable (if responsive design included)

### Performance Tests
- [ ] Template preview loads within 2 seconds
- [ ] First streaming URL available within 45 seconds
- [ ] InstantDB subscription updates within 1 second of callback
- [ ] Lyrics generation completes within 15 seconds
- [ ] Page load time < 3 seconds (Lighthouse)
- [ ] No memory leaks during extended use (30+ minutes)

---

## Documentation Requirements

### User-Facing Documentation
- [ ] **Studio Guide**: How to use templates, chat, and generate music
- [ ] **Template Comparison**: Explanation of each template's style
- [ ] **Advanced Controls**: What each parameter does (in Dutch)
- [ ] **Karaoke Mode**: How to use synchronized lyrics
- [ ] **Troubleshooting**: Common errors and solutions

### Developer Documentation
- [ ] **API Integration Guide**: How to work with Suno API
- [ ] **Template Creation**: How to add new templates
- [ ] **Callback Handling**: Architecture and flow diagrams
- [ ] **InstantDB Schema**: Entity relationships and indexes
- [ ] **State Management**: Component state flow
- [ ] **Testing Guide**: How to run tests and add new ones

### Code Comments
- [ ] Template configuration schema documentation
- [ ] Complex state transitions (gathering → generating → complete)
- [ ] Callback vs polling logic decision points
- [ ] Progressive loading state machine
- [ ] Error recovery strategies

---

## Rollout Plan

### Alpha (Internal Testing)
- **Audience**: Development team only
- **Features**: All features enabled, debug mode on
- **Duration**: 1 week
- **Success Criteria**: No critical bugs, < 45s playback achieved

### Beta (Limited Users)
- **Audience**: 20-50 selected users (waitlist)
- **Features**: All features, analytics tracking enabled
- **Duration**: 2 weeks
- **Success Criteria**:
  - 60%+ satisfaction rate
  - 70%+ use templates (vs "Verras me")
  - < 2 refinements per song average
  - 80%+ error recovery rate

### Production (General Availability)
- **Audience**: All users
- **Features**: All features, analytics + error monitoring
- **Rollout**: Gradual (10% → 50% → 100% over 1 week)
- **Success Criteria**: All beta metrics maintained

### Post-Launch Monitoring (First Month)
- **Metrics to Watch**:
  - Time to first playback (daily average)
  - Template usage distribution
  - Lyrics refinement rate
  - Error rate and types
  - User drop-off points
- **Review Cadence**: Daily for week 1, weekly for weeks 2-4
- **Iteration**: Fix critical issues within 48h, plan enhancements based on data

---

## Appendix

### A. Template Configuration Example

```typescript
// /templates/music-templates.ts
export const MUSIC_TEMPLATES: MusicTemplate[] = [
  {
    id: 'romantic-ballad',
    name: 'Romantische Ballad',
    description: 'Rustig, emotioneel, met piano en strijkers. Perfect voor diepe gevoelens.',
    previewAudioUrl: '/templates/romantic-ballad-preview.mp3',
    imageUrl: '/templates/romantic-ballad-cover.jpg',
    sunoConfig: {
      style: 'slow romantic ballad with piano and strings',
      tags: 'ballad, romantic, emotional, piano, orchestral',
      model: 'V5',
      styleWeight: 0.85,
      weirdnessConstraint: 0.3, // Keep it safe and predictable
      audioWeight: 0.6,
    },
  },
  {
    id: 'upbeat-pop',
    name: 'Vrolijke Pop',
    description: 'Energiek, catchy, modern. Voor een positieve, vrolijke vibe.',
    previewAudioUrl: '/templates/upbeat-pop-preview.mp3',
    imageUrl: '/templates/upbeat-pop-cover.jpg',
    sunoConfig: {
      style: 'upbeat modern pop with synths and drums',
      tags: 'pop, upbeat, catchy, energetic, modern',
      model: 'V5',
      styleWeight: 0.8,
      weirdnessConstraint: 0.5,
      audioWeight: 0.7,
    },
  },
  {
    id: 'acoustic-intimate',
    name: 'Akoestisch Intiem',
    description: 'Gitaar, zacht, persoonlijk. Voor een intieme, authentieke sfeer.',
    previewAudioUrl: '/templates/acoustic-intimate-preview.mp3',
    imageUrl: '/templates/acoustic-intimate-cover.jpg',
    sunoConfig: {
      style: 'soft acoustic guitar ballad, intimate and warm',
      tags: 'acoustic, intimate, guitar, soft, warm, personal',
      model: 'V5',
      styleWeight: 0.9,
      weirdnessConstraint: 0.2,
      audioWeight: 0.5,
    },
  },
];

export const SURPRISE_ME_TEMPLATE: MusicTemplate = {
  id: 'surprise-me',
  name: '✨ Verras me',
  description: 'Laat Suno helemaal los! Onvoorspelbaar en uniek.',
  previewAudioUrl: '', // No preview for surprise
  imageUrl: '/templates/surprise-me-cover.jpg',
  sunoConfig: {
    style: '', // Empty = max creativity
    tags: 'love song', // Minimal constraint
    model: 'V5',
    styleWeight: 0.5,
    weirdnessConstraint: 0.8, // High creativity
    audioWeight: 0.5,
  },
};
```

### B. Suno Lyrics Prompt Template

```typescript
// /lib/utils/sunoLyricsPrompt.ts
export function buildSunoLyricsPrompt(
  context: ExtractedContext,
  template: MusicTemplate,
  language: string = 'Nederlands'
): string {
  const { memories, emotions, partnerTraits } = context;

  return `Schrijf lyrics voor een ${template.name.toLowerCase()} liefdesliedje in het ${language}.

**Context:**
- Voor: ${context.partnerName || 'mijn geliefde'}
- Herinneringen: ${memories.slice(0, 5).join(', ')}
- Emoties: ${emotions.join(', ')}
- Eigenschappen: ${partnerTraits.slice(0, 5).join(', ')}

**Muzikale Stijl:**
${template.sunoConfig.style}

**Genres/Tags:**
${template.sunoConfig.tags}

**Instructies:**
- Schrijf complete lyrics met duidelijke verse/chorus/bridge structuur
- Gebruik de herinneringen en emoties op een natuurlijke, authentieke manier
- Houd de taal ${language === 'Nederlands' ? 'Nederlands' : language}
- Maak de tekst muzikaal (rijm, ritme, herhaling)
- Vermijd clichés, wees origineel en persoonlijk
- Lengte: ongeveer 200-300 woorden

Genereer de lyrics nu:`;
}
```

### C. Error Message Translations

```typescript
// /lib/utils/errorMessages.ts
export const SUNO_ERROR_MESSAGES: Record<string, string> = {
  // API Errors
  'INVALID_API_KEY': 'API configuratie fout. Neem contact op met support.',
  'RATE_LIMIT_EXCEEDED': 'Je hebt je limiet bereikt. Probeer het later opnieuw.',
  'INSUFFICIENT_CREDITS': 'Onvoldoende credits. Upgrade je account of wacht tot je credits vernieuwen.',
  'INVALID_PROMPT': 'De lyrics bevatten ongeldige tekens. Pas de tekst aan en probeer opnieuw.',
  'CONTENT_POLICY_VIOLATION': 'De inhoud voldoet niet aan de richtlijnen. Pas de tekst aan.',

  // Generation Errors
  'GENERATION_FAILED': 'Er ging iets mis met het genereren. Probeer het opnieuw.',
  'TIMEOUT': 'Generatie duurt langer dan verwacht. Probeer het opnieuw of pas lyrics aan.',
  'CALLBACK_TIMEOUT': 'We wachten nog op het resultaat. Even geduld...',

  // Network Errors
  'NETWORK_ERROR': 'Verbindingsprobleem. Controleer je internet en probeer opnieuw.',
  'SERVER_ERROR': 'Onze servers zijn momenteel overbelast. Probeer het over een paar minuten.',

  // Default
  'UNKNOWN_ERROR': 'Er ging iets onverwachts mis. Probeer het opnieuw of neem contact op met support.',
};

export function translateSunoError(errorCode: string, fallbackMessage?: string): string {
  return SUNO_ERROR_MESSAGES[errorCode] || fallbackMessage || SUNO_ERROR_MESSAGES.UNKNOWN_ERROR;
}
```

### D. Analytics Event Schema

```typescript
// /lib/analytics/events.ts
export interface AnalyticsEvent {
  name: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
}

// Event Definitions
export const ANALYTICS_EVENTS = {
  TEMPLATE_SELECTED: 'template_selected',
  LYRICS_GENERATION_STARTED: 'lyrics_generation_started',
  LYRICS_GENERATION_COMPLETED: 'lyrics_generation_completed',
  LYRICS_REFINEMENT_REQUESTED: 'lyrics_refinement_requested',
  MUSIC_GENERATION_STARTED: 'music_generation_started',
  MUSIC_GENERATION_FIRST_PLAYBACK: 'music_generation_first_playback', // PRIMARY METRIC
  MUSIC_GENERATION_COMPLETED: 'music_generation_completed',
  VARIANT_SELECTED: 'variant_selected',
  ADVANCED_CONTROLS_ENABLED: 'advanced_controls_enabled',
  ADVANCED_SETTING_CHANGED: 'advanced_setting_changed',
  KARAOKE_MODE_ENABLED: 'karaoke_mode_enabled',
  ERROR_ENCOUNTERED: 'error_encountered',
} as const;

// Usage example
import { trackEvent } from '@/lib/analytics';

trackEvent(ANALYTICS_EVENTS.MUSIC_GENERATION_FIRST_PLAYBACK, {
  timeToFirstPlayback: 38000,
  callbackReceived: true,
  pollingUsed: false,
  templateId: 'romantic-ballad',
});
```

---

## Revision History

| Version | Date       | Author | Changes                                      |
|---------|------------|--------|----------------------------------------------|
| 1.0     | 2025-10-10 | Claude | Initial PRD creation based on user requirements |

---

**Goedkeuring Vereist:**
- [ ] Product Owner (Eric)
- [ ] Technical Lead
- [ ] UX Designer (indien van toepassing)

**Status:** Draft - Awaiting Review
