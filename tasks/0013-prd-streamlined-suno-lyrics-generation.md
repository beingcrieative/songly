# PRD 0013: Gestroomlijnde Suno Lyrics Generatie met 2-Variant Vergelijking

## Introduction/Overview

De huidige studio applicatie heeft twee conflicterende lyrics generatie systemen:
1. **OpenRouter-based agent** (`/api/chat/generate-lyrics`) - Gebruikt GPT model voor lyrics generatie
2. **Suno lyrics API** (`/api/suno/lyrics`) - Native Suno lyrics generatie die 2 varianten kan produceren

Dit leidt tot verwarring, inconsistentie, en suboptimale resultaten. Gebruikers weten niet welk systeem actief is, en het proces van lyrics naar muziek is niet duidelijk gestroomlijnd.

### Doel

Een uniforme, voorspelbare lyrics generatie flow creëren waar:
1. **Suno altijd 2 lyric varianten** genereert na het conversatie-gedeelte
2. Gebruikers een **duidelijke progress indicator** zien tijdens generatie
3. **Beide varianten naast elkaar** kunnen worden vergeleken
4. Gebruikers **één variant kiezen** voordat ze verder kunnen
5. **Eenmalige refinement** mogelijk is (kostencontrole)
6. Parameters (taal, vocal gender, etc.) **na lyrics keuze** worden bevestigd
7. Het **oude OpenRouter systeem volledig verwijderd** wordt

---

## Goals

1. **Unified Lyrics Generation**: Één enkel systeem (Suno) voor alle lyrics generatie
2. **Transparantie**: Duidelijke progress indicators tijdens elke stap
3. **Gebruikerscontrole**: Verplichte keuze tussen 2 varianten voordat verder kan
4. **Kostencontrole**: Maximum 1 refinement ronde per liedje
5. **Gestroomlijnde Flow**: Gesprek → Lyrics (2 varianten) → Vergelijking → Keuze → Parameters → Audio
6. **Code Cleanup**: Verwijder alle OpenRouter lyrics generatie code
7. **Betrouwbaarheid**: Callback-first met polling fallback (zoals bij audio)

---

## User Stories

### US-1: Suno 2-Variant Lyrics Generatie
**Als** gebruiker
**Wil ik** na mijn gesprek automatisch 2 lyric varianten zien
**Zodat** ik kan kiezen welke versie het beste bij mijn verhaal past

**Acceptatiecriteria:**
- Na voldoende gesprek (readiness ≥ 70%) wordt Suno lyrics API aangeroepen
- Modal overlay toont "⏳ Lyrics worden gegenereerd..." met progress indicator
- Suno genereert 2 varianten (variant A en variant B)
- Na ontvangst (callback of polling) worden beide varianten getoond in vergelijkingsweergave
- Elke variant heeft volledige lyrics met [Verse], [Chorus], [Bridge] labels
- Duidelijke visuele scheiding tussen variant A en B

### US-2: Lyrics Vergelijking en Selectie
**Als** gebruiker
**Wil ik** beide lyric varianten naast elkaar kunnen lezen
**Zodat** ik een geïnformeerde keuze kan maken

**Acceptatiecriteria:**
- **Desktop**: 2 kolommen layout met scrollbare lyric panels
- **Mobile**: Gestapelde kaarten met swipe-gesture om te wisselen
- Elke variant heeft:
  - Label "Versie A" / "Versie B"
  - Radio button of "Kies deze" knop
  - "Kopieer tekst" knop
  - Volledige scrollbare lyrics
- "Gebruik geselecteerde lyrics" knop blijft **disabled** tot selectie is gemaakt
- Na selectie verdwijnt vergelijkingsweergave en gekozen lyrics wordt actief

### US-3: Eenmalige Lyrics Refinement
**Als** gebruiker
**Wil ik** één keer feedback kunnen geven op de gekozen lyrics
**Zodat** ik kleine aanpassingen kan maken zonder onbeperkte kosten

**Acceptatiecriteria:**
- Na selectie verschijnt "Verfijn lyrics" knop (1x beschikbaar)
- Bij klikken: tekstinvoer voor feedback (bijv. "Maak chorus vrolijker", "Voeg referentie toe aan ons eerste date")
- Na verzenden:
  - Modal toont "⏳ Lyrics worden verfijnd..."
  - Suno wordt aangeroepen met `previousLyrics` + `feedback` + `context` + `templateId`
  - Verfijnde lyrics vervangen de huidige versie
  - "Verfijn lyrics" knop wordt disabled met label "✓ Verfijnd (gebruikt)"
- Gebruiker kan daarna alleen nog handmatig bewerken (geen extra AI refinement)

### US-4: Handmatige Lyrics Bewerking
**Als** gebruiker
**Wil ik** de lyrics handmatig kunnen aanpassen
**Zodat** ik kleine correcties kan maken zonder extra API calls

**Acceptatiecriteria:**
- "Bewerk lyrics" knop altijd beschikbaar
- Bij klikken: modal editor met tekstinvoer (pre-filled met huidige lyrics)
- "Opslaan" knop:
  - Valideert minimale lengte (>50 karakters)
  - Slaat op als nieuwe lyric_version met `isManual: true` flag
  - Sluit modal en toont bijgewerkte lyrics
- "Annuleer" knop: sluit modal zonder opslaan

### US-5: Parameters Bevestiging Voor Audio
**Als** gebruiker
**Wil ik** vóór audio generatie de parameters (taal, vocal gender, etc.) bevestigen
**Zodat** het eindresultaat aansluit bij mijn verwachtingen

**Acceptatiecriteria:**
- Na lyrics selectie (en optioneel refinement/edit) verschijnt "Genereer Muziek" knop
- Bij klikken: ParameterSheet modal opent met:
  - **Basis parameters** (al gebruikt voor lyrics):
    - Taal: Nederlands, English, etc. (dropdown)
    - Vocal Gender: Male, Female, Neutral (radio buttons)
  - **Audio-specifieke parameters**:
    - Vocal Age: Young, Mature, Deep (optioneel)
    - Template selectie (indien niet al gekozen)
    - Instrumental toggle
  - **Advanced controls** (toggleable):
    - Style Weight slider (0-100%)
    - Weirdness Constraint slider (0-100%)
    - Audio Weight slider (0-100%)
    - Model dropdown (V4, V4_5, V5)
- "Bevestig & Genereer" knop:
  - Slaat parameters op in `songSettings`
  - Start muziek generatie via `/api/suno` (bestaand systeem)
  - Toont MusicGenerationProgress modal

### US-6: Progress Indicators
**Als** gebruiker
**Wil ik** tijdens lyrics generatie zien wat er gebeurt
**Zodat** ik weet dat het systeem aan het werk is

**Acceptatiecriteria:**
- **Lyrics generatie start**: Modal overlay met:
  - Titel: "Lyrics worden gegenereerd"
  - Animatie (spinner of progress bar)
  - Tekst: "Suno AI schrijft 2 unieke versies van je liedje..."
  - Geschatte tijd: "Dit duurt ongeveer 30-45 seconden"
- **Refinement**: Zelfde modal met:
  - Titel: "Lyrics worden verfijnd"
  - Tekst: "Suno verwerkt je feedback..."
- **Polling fallback**: Bij timeout (>120 seconden):
  - Error modal met opties:
    - "Probeer opnieuw"
    - "Terug naar gesprek"

### US-7: Error Recovery
**Als** gebruiker
**Wil ik** duidelijke foutmeldingen krijgen als iets misgaat
**Zodat** ik weet hoe ik verder kan

**Acceptatiecriteria:**
- Bij Suno API errors (400/500):
  - Nederlandstalige foutmelding (geen technische details)
  - "Probeer opnieuw" knop
  - "Terug naar gesprek" knop
- Bij rate limiting (429):
  - Melding: "Je hebt je limiet bereikt. Probeer het over X minuten."
  - Geschatte wachttijd (indien beschikbaar)
- Bij timeout:
  - Melding: "Generatie duurt langer dan verwacht"
  - "Blijf wachten" (continue polling)
  - "Annuleer en probeer opnieuw"

---

## Functional Requirements

### FR-1: Suno Lyrics API Integration

**1.1** Verwijder alle code gerelateerd aan OpenRouter lyrics generatie:
- Delete `/src/app/api/chat/generate-lyrics/route.ts`
- Delete `/src/lib/prompts/lyricsAgent.ts`
- Remove references in StudioClient.tsx
- Clean up any unused utility functions

**1.2** Gebruik Suno `/api/v1/lyrics` als enige lyrics generatie endpoint

**1.3** Bij readiness score ≥ 70% OF user trigger:
- Bouw Suno lyrics prompt met:
  ```typescript
  {
    prompt: buildSunoLyricsPrompt(extractedContext, template, language),
    callBackUrl: `${CALLBACK_BASE}/api/suno/lyrics/callback?conversationId=${conversationId}`
  }
  ```

**1.4** Suno lyrics prompt formatting:
```typescript
function buildSunoLyricsPrompt(
  context: ExtractedContext,
  template: MusicTemplate,
  language: string
): string {
  return `Schrijf lyrics voor een ${template.name} liefdesliedje in het ${language}.

Context:
- Voor: ${context.partnerName || 'mijn geliefde'}
- Herinneringen: ${context.memories.slice(0, 5).join(', ')}
- Emoties: ${context.emotions.join(', ')}
- Eigenschappen: ${context.partnerTraits.slice(0, 5).join(', ')}
- Taal: ${language}
- Sfeer: ${context.mood?.join(', ') || 'romantisch'}

Stijl: ${template.sunoConfig.style}
Tags: ${template.sunoConfig.tags}

Genereer complete lyrics met [Verse 1], [Chorus], [Verse 2], [Bridge] structuur.
Gebruik de herinneringen en emoties op een natuurlijke manier.
Vermijd clichés, wees origineel en persoonlijk.`;
}
```

**1.5** Response handling:
- Parse `task_id` from response
- Store in state: `setLyricsTaskId(taskId)`
- Start polling (if callback doesn't arrive within 10s)

### FR-2: Progress Modal tijdens Lyrics Generatie

**2.1** Create `LyricsGenerationProgress` component (similar to `MusicGenerationProgress`)

**2.2** Modal structure:
```tsx
<Modal isOpen={isGeneratingLyrics} onClose={null}>
  <div className="text-center p-8">
    <Spinner className="mx-auto mb-4" />
    <h2 className="text-xl font-bold mb-2">
      {isRefining ? 'Lyrics worden verfijnd' : 'Lyrics worden gegenereerd'}
    </h2>
    <p className="text-gray-600 mb-4">
      {isRefining
        ? 'Suno verwerkt je feedback...'
        : 'Suno AI schrijft 2 unieke versies van je liedje...'}
    </p>
    <p className="text-sm text-gray-500">
      Dit duurt ongeveer 30-45 seconden
    </p>
    {pollingAttempts > 12 && (
      <button onClick={handleCancel} className="mt-4 text-pink-600">
        Annuleren
      </button>
    )}
  </div>
</Modal>
```

**2.3** Show during:
- Initial lyrics generation (after conversation)
- Refinement (after user feedback)

**2.4** Hide when:
- Callback received with lyrics
- Polling succeeds with status 'complete'
- Error occurs (transition to error modal)

### FR-3: Callback & Polling Mechanisme

**3.1** Primary: Callback via `/api/suno/lyrics/callback`

**Callback handler** (`/src/app/api/suno/lyrics/callback/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  const body = await request.json();
  const { task_id, data } = body;

  // Parse lyrics variants from Suno response
  const lyrics = data?.lyrics || data?.data?.lyrics;
  const lyricsArray = Array.isArray(lyrics) ? lyrics : [lyrics];

  // Store in cache for immediate retrieval
  setLyricsTaskComplete(task_id, lyricsArray);

  // Update InstantDB (if conversationId provided)
  if (conversationId) {
    const admin = getAdminDb();
    await admin.transact(
      admin.tx.conversations[conversationId].update({
        conceptLyrics: lyricsArray.length >= 2 ? {
          variantA: lyricsArray[0],
          variantB: lyricsArray[1]
        } : { variantA: lyricsArray[0] },
        updatedAt: Date.now()
      })
    );
  }

  return NextResponse.json({ success: true });
}
```

**3.2** Fallback: Polling via `/api/suno/lyrics?taskId={taskId}`

**Polling logic** (in StudioClient.tsx):
```typescript
async function pollLyricsStatus(taskId: string): Promise<void> {
  let attempts = 0;
  const maxAttempts = 24; // 24 * 5s = 120s timeout

  const poll = async () => {
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error('Lyrics generation timed out');
    }

    const response = await fetch(`/api/suno/lyrics?taskId=${taskId}`);
    const data = await response.json();

    if (data.status === 'complete' && data.variants) {
      // Success! Show variants
      setPendingLyricVariants(data.variants);
      setIsGeneratingLyrics(false);
      setShowLyricsCompare(true);
      trackLyricsOptionsShown(data.variants.length);
      return;
    } else if (data.status === 'failed') {
      throw new Error(data.error || 'Lyrics generation failed');
    }

    // Still generating, poll again
    setTimeout(poll, 5000);
  };

  // Start polling after 10s (give callback time to arrive)
  setTimeout(poll, 10000);
}
```

**3.3** Cache mechanism (existing):
- Use `/src/app/api/suno/lyrics/cache.ts` for in-memory storage
- `setLyricsTaskGenerating(taskId)` when starting
- `setLyricsTaskComplete(taskId, variants)` when done
- `getLyricsTask(taskId)` to retrieve cached results

### FR-4: Lyrics Vergelijkingsweergave

**4.1** Create `LyricsCompare` component (already exists, enhance as needed)

**4.2** Desktop layout:
```tsx
<div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto p-6">
  {/* Variant A */}
  <LyricsCard
    variant="A"
    lyrics={variantA}
    isSelected={selectedVariant === 'A'}
    onSelect={() => setSelectedVariant('A')}
    onCopy={() => copyToClipboard(variantA)}
  />

  {/* Variant B */}
  <LyricsCard
    variant="B"
    lyrics={variantB}
    isSelected={selectedVariant === 'B'}
    onSelect={() => setSelectedVariant('B')}
    onCopy={() => copyToClipboard(variantB)}
  />
</div>

<div className="text-center mt-6">
  <button
    disabled={!selectedVariant}
    onClick={handleUseSelected}
    className="btn-primary"
  >
    Gebruik geselecteerde lyrics
  </button>
</div>
```

**4.3** Mobile layout:
```tsx
<div className="flex flex-col gap-4 p-4">
  {/* Swipeable cards */}
  <SwipeableCards
    cards={[
      <LyricsCard variant="A" lyrics={variantA} />,
      <LyricsCard variant="B" lyrics={variantB} />
    ]}
    onSwipe={(index) => setFocusedVariant(index)}
  />

  {/* Sticky CTA */}
  <div className="sticky bottom-0 bg-white border-t p-4">
    <button
      disabled={!selectedVariant}
      onClick={handleUseSelected}
      className="btn-primary w-full"
    >
      Gebruik geselecteerde lyrics
    </button>
  </div>
</div>
```

**4.4** LyricsCard component:
```tsx
interface LyricsCardProps {
  variant: 'A' | 'B';
  lyrics: string;
  isSelected?: boolean;
  onSelect?: () => void;
  onCopy?: () => void;
}

export function LyricsCard({ variant, lyrics, isSelected, onSelect, onCopy }: LyricsCardProps) {
  return (
    <div className={`border-2 rounded-lg p-6 ${isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Versie {variant}</h3>
        <input
          type="radio"
          checked={isSelected}
          onChange={onSelect}
          className="w-5 h-5"
        />
      </div>

      <div className="bg-white rounded p-4 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-sm">
        {lyrics}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onCopy} className="btn-secondary text-sm">
          📋 Kopieer tekst
        </button>
      </div>
    </div>
  );
}
```

**4.5** Selection handling:
```typescript
const handleUseSelected = () => {
  const selectedLyrics = selectedVariant === 'A' ? variantA : variantB;

  // Track analytics
  trackLyricsOptionSelected(selectedVariant, variantA.length, variantB.length);

  // Store as active lyrics
  setActiveLyrics(selectedLyrics);
  setConceptLyrics({ selected: selectedLyrics });

  // Hide compare view
  setShowLyricsCompare(false);

  // Show next step (refinement options)
  setShowRefinementOptions(true);
};
```

### FR-5: Eenmalige Refinement

**5.1** Add refinement UI after selection:
```tsx
{showRefinementOptions && (
  <div className="mt-6 p-4 border rounded-lg">
    <h3 className="font-bold mb-2">Lyrics aanpassen</h3>

    {!refinementUsed ? (
      <div>
        <label className="block text-sm mb-2">
          Geef feedback voor verfijning (éénmalig):
        </label>
        <textarea
          value={refinementFeedback}
          onChange={(e) => setRefinementFeedback(e.target.value)}
          placeholder="Bijv: Maak de chorus vrolijker, voeg referentie toe aan ons eerste date"
          className="w-full border rounded p-2 mb-2"
          rows={3}
        />
        <button
          onClick={handleRefine}
          disabled={!refinementFeedback.trim()}
          className="btn-primary"
        >
          Verfijn lyrics
        </button>
      </div>
    ) : (
      <p className="text-green-600">✓ Verfijnd (gebruikt)</p>
    )}

    <div className="mt-4">
      <button onClick={handleManualEdit} className="btn-secondary">
        ✏️ Bewerk handmatig
      </button>
    </div>

    <div className="mt-6">
      <button
        onClick={handleProceedToParameters}
        className="btn-primary w-full"
      >
        Genereer Muziek →
      </button>
    </div>
  </div>
)}
```

**5.2** Refinement logic:
```typescript
const handleRefine = async () => {
  if (!refinementFeedback.trim() || refinementUsed) return;

  trackLyricsRefined();
  setIsGeneratingLyrics(true);

  try {
    const response = await fetch('/api/suno/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previousLyrics: activeLyrics,
        feedback: refinementFeedback,
        templateId: selectedTemplateId,
        context: extractedContext
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Poll for refined lyrics
    await pollLyricsStatus(data.taskId);

    // Mark refinement as used
    setRefinementUsed(true);
    setRefinementFeedback('');

  } catch (error) {
    console.error('Refinement error:', error);
    setShowErrorModal(true);
    setErrorMessage(error.message);
  } finally {
    setIsGeneratingLyrics(false);
  }
};
```

**5.3** Manual edit modal:
```tsx
<Modal isOpen={showManualEdit} onClose={() => setShowManualEdit(false)}>
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">Lyrics bewerken</h2>
    <textarea
      value={manualEditLyrics}
      onChange={(e) => setManualEditLyrics(e.target.value)}
      className="w-full border rounded p-4 font-mono text-sm"
      rows={20}
    />
    <div className="flex gap-2 mt-4">
      <button onClick={handleSaveManualEdit} className="btn-primary">
        Opslaan
      </button>
      <button onClick={() => setShowManualEdit(false)} className="btn-secondary">
        Annuleren
      </button>
    </div>
  </div>
</Modal>
```

### FR-6: Parameters Sheet voor Audio Generatie

**6.1** Reuse existing `ParameterSheet` component

**6.2** Trigger when user clicks "Genereer Muziek"

**6.3** Pre-fill with values from lyrics generation:
```typescript
const handleProceedToParameters = () => {
  setParameterSheetOpen(true);

  // Pre-fill with values used for lyrics
  setParameterDefaults({
    language: extractedContext.language || 'Nederlands',
    vocalGender: songSettings.vocalGender || 'neutral',
    vocalAge: songSettings.vocalAge
  });

  setParameterExtras({
    title: conceptTitle || 'Mijn Liefdesliedje',
    selectedTemplateId: selectedTemplateId,
    instrumental: songSettings.makeInstrumental || false,
    styleWeight: templateConfig?.styleWeight ?? 0.5,
    weirdnessConstraint: templateConfig?.weirdnessConstraint ?? 0.2,
    audioWeight: templateConfig?.audioWeight ?? 0.6
  });
};
```

**6.4** On confirm, start music generation:
```typescript
const handleParametersConfirmed = async (
  values: ParameterValues,
  extras: ParameterSheetExtras
) => {
  setParameterSheetOpen(false);

  // Create song entity
  const newSongId = id();
  const template = getTemplateById(extras.selectedTemplateId);

  // Build music generation request
  await fetch('/api/suno', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      songId: newSongId,
      title: extras.title,
      lyrics: activeLyrics,
      musicStyle: template?.sunoConfig.tags || '',
      model: template?.sunoConfig.model || 'V5',
      vocalGender: values.vocalGender,
      vocalAge: values.vocalAge,
      makeInstrumental: extras.instrumental,
      styleWeight: extras.styleWeight,
      weirdnessConstraint: extras.weirdnessConstraint,
      audioWeight: extras.audioWeight
    })
  });

  // Show music generation progress
  setShowMusicProgress(true);
};
```

### FR-7: Analytics Events

**7.1** Track lyrics generation start:
```typescript
export function trackLyricsGenerationStarted(conversationRounds: number, readinessScore: number) {
  analytics.track('lyrics_generation_started', {
    conversationRounds,
    readinessScore,
    timestamp: Date.now()
  });
}
```

**7.2** Track when variants are shown:
```typescript
export function trackLyricsOptionsShown(variantCount: number) {
  analytics.track('lyrics_options_shown', {
    variantCount,
    timestamp: Date.now()
  });
}
```

**7.3** Track variant selection:
```typescript
export function trackLyricsOptionSelected(
  selectedVariant: 'A' | 'B',
  variantALength: number,
  variantBLength: number
) {
  analytics.track('lyrics_option_selected', {
    selectedVariant,
    variantALength,
    variantBLength,
    timestamp: Date.now()
  });
}
```

**7.4** Track refinement:
```typescript
export function trackLyricsRefined(feedbackLength: number) {
  analytics.track('lyrics_refined', {
    feedbackLength,
    timestamp: Date.now()
  });
}
```

**7.5** Track regeneration (if implemented):
```typescript
export function trackLyricsRegenerated(reason: string) {
  analytics.track('lyrics_regenerated', {
    reason,
    timestamp: Date.now()
  });
}
```

### FR-8: Data Persistence (InstantDB)

**8.1** Store lyrics variants in conversation:
```typescript
// Schema update (if needed)
conversations: i.entity({
  // ... existing fields
  conceptLyrics: i.json<{
    variantA?: string;
    variantB?: string;
    selected?: string;
    refined?: string;
    manual?: string;
  }>().optional(),
  lyricsTaskId: i.string().optional()
})
```

**8.2** Save selected lyrics as lyric_version:
```typescript
await db.transact(
  db.tx.lyric_versions[id()].update({
    conversationId,
    content: selectedLyrics,
    label: `Suno Variant ${selectedVariant}`,
    hash: hashLyrics(selectedLyrics),
    version: 1,
    variantIndex: selectedVariant === 'A' ? 0 : 1,
    variantSource: 'suno',
    isManual: false,
    isRefined: false,
    isSelection: true,
    createdAt: Date.now()
  })
);
```

**8.3** Save refined lyrics:
```typescript
await db.transact(
  db.tx.lyric_versions[id()].update({
    conversationId,
    content: refinedLyrics,
    label: 'Suno Verfijnd',
    hash: hashLyrics(refinedLyrics),
    version: 2,
    variantSource: 'suno',
    isManual: false,
    isRefined: true,
    isSelection: false,
    createdAt: Date.now()
  })
);
```

**8.4** Save manual edits:
```typescript
await db.transact(
  db.tx.lyric_versions[id()].update({
    conversationId,
    content: manuallyEditedLyrics,
    label: 'Handmatig bewerkt',
    hash: hashLyrics(manuallyEditedLyrics),
    version: 3,
    variantSource: 'manual',
    isManual: true,
    isRefined: false,
    isSelection: false,
    createdAt: Date.now()
  })
);
```

---

## Non-Goals (Out of Scope)

**NG-1** Multiple refinement rounds - Only 1 refinement per session (cost control)

**NG-2** Regenerate unlimited lyrics - Users must use refinement or manual edit

**NG-3** Lyrics version history UI - Versions are stored but not shown in UI (future feature)

**NG-4** Collaborative lyrics editing - One user per session

**NG-5** Karaoke/timestamped lyrics - Handled separately (existing PRD)

**NG-6** Template selection during lyrics - Template is chosen before conversation starts

**NG-7** Multi-language lyrics in one song - Single language per song

**NG-8** Export lyrics separately - Only export as part of complete song

---

## Design Considerations

### UI/UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CONVERSATION PHASE                                       │
│    Chat interface (middle pane)                             │
│    Context extraction (right pane)                          │
│    "Genereer Lyrics" knop (when ready)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. LYRICS GENERATION (Modal Overlay)                        │
│    ⏳ "Lyrics worden gegenereerd..."                        │
│    Suno API call → 2 variants                               │
│    Progress: ~30-45 seconds                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LYRICS COMPARISON (2-Column Layout)                      │
│    ┌─────────────────┐  ┌─────────────────┐                │
│    │   Versie A      │  │   Versie B      │                │
│    │   [Lyrics...]   │  │   [Lyrics...]   │                │
│    │   ○ Kies deze   │  │   ● Kies deze   │                │
│    └─────────────────┘  └─────────────────┘                │
│                                                              │
│    [ Gebruik geselecteerde lyrics ] (enabled after choice)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. REFINEMENT OPTIONS (Optional)                            │
│    ✏️ Verfijn lyrics (1x beschikbaar)                       │
│       [Feedback tekstinvoer]                                │
│       [Verfijn knop]                                        │
│                                                              │
│    ✏️ Bewerk handmatig                                      │
│       [Bewerk knop]                                         │
│                                                              │
│    [ Genereer Muziek → ]                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. PARAMETERS CONFIRMATION (Sheet/Modal)                    │
│    Taal: [Nederlands ▼]                                     │
│    Vocal Gender: (●) Male  ( ) Female  ( ) Neutral          │
│    Vocal Age: [Mature ▼] (optional)                         │
│    Template: [Romantic Ballad ▼]                            │
│    Instrumental: [ ] Maak instrumental versie               │
│                                                              │
│    ▶ Geavanceerde opties (toggleable)                       │
│                                                              │
│    [ Bevestig & Genereer Muziek ]                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. MUSIC GENERATION (Existing Flow)                         │
│    Progress modal → Variant selection → Music player        │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

```
StudioClient.tsx
├── ConversationalStudioLayout
│   ├── ChatInterface (middle)
│   └── LyricsPanel (right)
│
├── LyricsGenerationProgress (NEW - modal overlay)
│   ├── Spinner
│   ├── Progress message
│   └── Cancel button (after timeout)
│
├── LyricsCompare (ENHANCED - modal or full-screen view)
│   ├── LyricsCard (variant A)
│   │   ├── Variant label
│   │   ├── Scrollable lyrics
│   │   ├── Radio/select button
│   │   └── Copy button
│   ├── LyricsCard (variant B)
│   └── "Gebruik geselecteerde" CTA
│
├── RefinementOptions (NEW - collapsible section)
│   ├── Feedback textarea (1x use)
│   ├── Refine button
│   ├── Manual edit button
│   └── Proceed to parameters button
│
├── ManualEditModal (NEW)
│   ├── Textarea editor
│   ├── Save button
│   └── Cancel button
│
├── ParameterSheet (REUSE - existing component)
│   ├── Language select
│   ├── Vocal gender radio
│   ├── Vocal age select (optional)
│   ├── Template select
│   ├── Instrumental toggle
│   ├── Advanced controls (toggleable)
│   └── Confirm button
│
└── MusicGenerationProgress (EXISTING)
    └── ... (no changes)
```

### Mobile Responsiveness

**Lyrics Comparison (Mobile):**
```tsx
// Stack cards vertically with swipe
<div className="md:grid md:grid-cols-2 flex flex-col gap-4">
  <SwipeableCards onSwipe={handleSwipe}>
    <LyricsCard variant="A" />
    <LyricsCard variant="B" />
  </SwipeableCards>
</div>

// Sticky CTA at bottom
<div className="sticky bottom-0 bg-white border-t p-4 md:relative">
  <button className="w-full btn-primary">
    Gebruik geselecteerde lyrics
  </button>
</div>
```

**Parameter Sheet (Mobile):**
- Use full-screen modal instead of side sheet
- Stack controls vertically
- Hide advanced controls by default (show after toggle)

---

## Technical Considerations

### API Routes

**To DELETE:**
- `/src/app/api/chat/generate-lyrics/route.ts` - Remove OpenRouter lyrics agent
- Any middleware or utilities specific to old lyrics system

**To KEEP/ENHANCE:**
- `/src/app/api/suno/lyrics/route.ts` - Main Suno lyrics endpoint (POST & GET)
- `/src/app/api/suno/lyrics/callback/route.ts` - Webhook receiver
- `/src/app/api/suno/lyrics/cache.ts` - In-memory caching

**To CREATE:**
- None (reuse existing routes)

### State Management

**New state variables in StudioClient:**
```typescript
// Lyrics generation
const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
const [lyricsTaskId, setLyricsTaskId] = useState<string | null>(null);
const [pendingLyricVariants, setPendingLyricVariants] = useState<string[]>([]);

// Lyrics comparison
const [showLyricsCompare, setShowLyricsCompare] = useState(false);
const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | null>(null);
const [activeLyrics, setActiveLyrics] = useState<string>('');

// Refinement
const [showRefinementOptions, setShowRefinementOptions] = useState(false);
const [refinementUsed, setRefinementUsed] = useState(false);
const [refinementFeedback, setRefinementFeedback] = useState('');

// Manual edit
const [showManualEdit, setShowManualEdit] = useState(false);
const [manualEditLyrics, setManualEditLyrics] = useState('');

// Parameters
const [parameterSheetOpen, setParameterSheetOpen] = useState(false);
```

### Suno API Integration

**Request format** (from sunoapi.md):
```typescript
// POST /api/v1/lyrics (via our proxy /api/suno/lyrics)
{
  prompt: string;              // Built via buildSunoLyricsPrompt()
  callBackUrl?: string;        // Webhook endpoint

  // For refinement:
  previousLyrics?: string;     // Previous version
  feedback?: string;           // User feedback
  templateId?: string;         // Template context
  context?: ExtractedContext;  // Conversation context
}
```

**Response format:**
```typescript
{
  taskId: string;              // Store for polling
  status: 'generating';
  message: string;
}
```

**Callback payload:**
```typescript
{
  task_id: string;
  status: 'SUCCESS' | 'FAILED';
  data: {
    lyrics: string[] | string; // 2 variants or 1
  }
}
```

### Database Schema

**No changes needed** - Existing schema already supports:
- `conversations.conceptLyrics` (JSON field)
- `conversations.lyricsTaskId` (string)
- `lyric_versions` table (for versioning)

**Ensure indexes exist:**
```typescript
// instant.schema.ts
conversations: i.entity({
  // ...
  lyricsTaskId: i.string().optional().indexed(), // Add index if missing
})
```

### Environment Variables

**Required:**
```bash
SUNO_API_KEY=sk-xxx                           # Already exists
NEXT_PUBLIC_BASE_URL=https://your-domain.com  # For callback URL
```

**Optional:**
```bash
NEXT_PUBLIC_ENABLE_LYRICS_COMPARE=true        # Feature flag (default: true)
SUNO_LYRICS_TIMEOUT_MS=120000                 # Polling timeout (default: 120s)
```

### Performance

**Optimize polling:**
- Start polling after 10s (give callback time)
- Poll every 5s (not too aggressive)
- Max 24 attempts (120s total)
- Cancel on component unmount

**Cache optimization:**
- Prune cache every request (`pruneLyricsCache()`)
- Keep only last 100 entries
- TTL: 30 minutes

**Component optimization:**
- Lazy load `LyricsCompare` and `ManualEditModal`
- Memoize lyrics formatting
- Use React.memo for `LyricsCard`

---

## Success Metrics

### Primary Metrics

**SM-1: Lyrics Generation Success Rate**
- Target: ≥95% success rate (complete lyrics received)
- Measure: (Successful generations / Total attempts) * 100

**SM-2: Time to Lyrics Display**
- Target: ≤45 seconds (from button click to variants shown)
- Measure: Average time from API call to callback/poll success

**SM-3: Variant Selection Rate**
- Target: ≥90% users select a variant (not drop off)
- Measure: (Users who selected / Users who saw variants) * 100

**SM-4: Refinement Usage**
- Target: ≤30% use refinement (shows initial quality is good)
- Measure: (Users who refined / Users who selected) * 100

**SM-5: Conversion to Music Generation**
- Target: ≥80% proceed to music generation after lyrics
- Measure: (Users who generated music / Users who selected lyrics) * 100

### Secondary Metrics

**SM-6: Variant Distribution**
- Target: ~50/50 split between A and B (shows both are good)
- Measure: Percentage selecting A vs B

**SM-7: Manual Edit Usage**
- Target: ≤10% manually edit (shows refinement is sufficient)
- Measure: (Users who manually edited / Users who selected) * 100

**SM-8: Callback Success Rate**
- Target: ≥70% receive callback (rest use polling fallback)
- Measure: (Callbacks received / Total generations) * 100

**SM-9: Error Recovery Rate**
- Target: ≥60% retry after error
- Measure: (Successful retries / Total errors) * 100

### Analytics Events

```typescript
// Track in lib/analytics/events.ts
export const LYRICS_EVENTS = {
  GENERATION_STARTED: 'lyrics_generation_started',
  OPTIONS_SHOWN: 'lyrics_options_shown',
  OPTION_SELECTED: 'lyrics_option_selected',
  REFINED: 'lyrics_refined',
  MANUALLY_EDITED: 'lyrics_manually_edited',
  REGENERATED: 'lyrics_regenerated',
  PROCEEDED_TO_MUSIC: 'lyrics_proceeded_to_music',
  GENERATION_FAILED: 'lyrics_generation_failed'
};
```

---

## Open Questions

### OQ-1: Suno Lyrics Variant Count
**Question**: Does Suno `/api/v1/lyrics` always return 2 variants, or can we request a specific count?

**Research Needed**: Check Suno API documentation for `count` or `variants` parameter

**Fallback**: If only 1 variant is returned, show single card (no comparison) but still offer refinement

---

### OQ-2: Callback Reliability
**Question**: How reliable are Suno callbacks in production? Should we rely on them primarily or use polling?

**Current Approach**: Callback-first with 10s polling fallback (hybrid)

**Monitoring Needed**: Track callback arrival rate in production analytics

---

### OQ-3: Lyrics Prompt Length Limits
**Question**: What are the min/max character limits for Suno lyrics prompt?

**Current Implementation**: Min 40, Max 700 characters (from existing code)

**Validation**: Ensure our prompt builder stays within these limits

---

### OQ-4: Refinement Cost
**Question**: Does each refinement call cost the same as initial generation?

**Assumption**: Yes, treat as separate API call

**Cost Control**: Limit to 1 refinement per session

---

### OQ-5: Template Pre-selection
**Question**: Should users select template BEFORE conversation, or can they choose during parameters step?

**Current Flow**: Template selected before/during conversation (from PRD 0005)

**Decision**: Keep template selection early, use in lyrics prompt for better consistency

---

### OQ-6: Mobile Swipe Implementation
**Question**: Use lightweight library (react-swipeable) or custom implementation?

**Recommendation**: Start with custom implementation (simpler, less dependencies)

**Upgrade Path**: If complex gestures needed, add react-swipeable later

---

## Implementation Plan

### Phase 1: Core Lyrics Generation (Week 1)
**Goal**: Replace OpenRouter with Suno, show 2 variants

**Tasks:**
- [ ] Delete `/api/chat/generate-lyrics` route and all references
- [ ] Remove `lyricsAgent.ts` prompts
- [ ] Enhance `buildSunoLyricsPrompt()` function
- [ ] Create `LyricsGenerationProgress` modal component
- [ ] Test callback + polling for 2 variants
- [ ] Update StudioClient to use only Suno API
- [ ] Add analytics events (generation_started, options_shown)

**Deliverable**: Users see 2 Suno-generated variants after conversation

---

### Phase 2: Comparison & Selection (Week 2)
**Goal**: Side-by-side comparison with selection gating

**Tasks:**
- [ ] Enhance `LyricsCompare` component for desktop
- [ ] Add mobile swipeable layout
- [ ] Implement `LyricsCard` with radio selection
- [ ] Add "Gebruik geselecteerde lyrics" CTA (disabled until selection)
- [ ] Store selected variant in state + InstantDB
- [ ] Add analytics (option_selected event)
- [ ] Add copy-to-clipboard functionality

**Deliverable**: Users can compare and select their preferred variant

---

### Phase 3: Refinement & Manual Edit (Week 3)
**Goal**: One-time refinement and manual editing

**Tasks:**
- [ ] Create `RefinementOptions` component
- [ ] Implement feedback textarea + submit logic
- [ ] Add refinement API call with previous lyrics + feedback
- [ ] Create `ManualEditModal` component
- [ ] Implement manual save with `isManual: true` flag
- [ ] Add analytics (refined, manually_edited events)
- [ ] Test refinement → variant replacement flow

**Deliverable**: Users can refine (1x) or manually edit their lyrics

---

### Phase 4: Parameters Integration (Week 4)
**Goal**: Seamless transition to music generation

**Tasks:**
- [ ] Add "Genereer Muziek" button after lyrics selection/refinement
- [ ] Pre-fill `ParameterSheet` with conversation context
- [ ] Ensure template config carries through to music generation
- [ ] Test end-to-end: Conversation → Lyrics → Selection → Parameters → Music
- [ ] Add analytics (proceeded_to_music event)
- [ ] Verify all parameters reach Suno music endpoint correctly

**Deliverable**: Complete flow from conversation to music works seamlessly

---

### Phase 5: Error Handling & Polish (Week 5)
**Goal**: Robust error recovery and production readiness

**Tasks:**
- [ ] Create error modal for timeouts and API failures
- [ ] Implement retry logic with exponential backoff
- [ ] Add "Terug naar gesprek" fallback option
- [ ] Polish UI transitions and loading states
- [ ] Add comprehensive error logging
- [ ] Monitor analytics for drop-off points
- [ ] Performance testing (callback speed, polling efficiency)

**Deliverable**: Production-ready lyrics generation system

---

## Testing Strategy

### Unit Tests

**Test: `buildSunoLyricsPrompt()`**
```typescript
describe('buildSunoLyricsPrompt', () => {
  it('includes all context fields', () => {
    const context = { memories: ['beach'], emotions: ['love'], ... };
    const template = { name: 'Romantic Ballad', ... };
    const prompt = buildSunoLyricsPrompt(context, template, 'Nederlands');

    expect(prompt).toContain('beach');
    expect(prompt).toContain('love');
    expect(prompt).toContain('Nederlands');
  });

  it('respects character limits', () => {
    const prompt = buildSunoLyricsPrompt(context, template, 'English');
    expect(prompt.length).toBeGreaterThan(40);
    expect(prompt.length).toBeLessThan(700);
  });
});
```

**Test: Variant selection logic**
```typescript
describe('LyricsCompare', () => {
  it('disables CTA until variant selected', () => {
    const { getByText } = render(<LyricsCompare variants={[...]} />);
    const button = getByText('Gebruik geselecteerde lyrics');
    expect(button).toBeDisabled();
  });

  it('enables CTA after selection', () => {
    const { getByText } = render(<LyricsCompare variants={[...]} />);
    fireEvent.click(getByText('Kies deze')); // Select variant A
    const button = getByText('Gebruik geselecteerde lyrics');
    expect(button).not.toBeDisabled();
  });
});
```

### Integration Tests

**Test: End-to-end lyrics generation**
```typescript
describe('Lyrics Generation Flow', () => {
  it('generates 2 variants via Suno', async () => {
    // Mock Suno API
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ taskId: 'test-123', status: 'generating' })
    });

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: 'complete',
        variants: ['Lyrics A', 'Lyrics B']
      })
    });

    const { getByText } = render(<StudioClient />);
    fireEvent.click(getByText('Genereer Lyrics'));

    await waitFor(() => {
      expect(getByText('Versie A')).toBeInTheDocument();
      expect(getByText('Versie B')).toBeInTheDocument();
    });
  });
});
```

**Test: Refinement flow**
```typescript
describe('Lyrics Refinement', () => {
  it('allows one refinement then disables', async () => {
    const { getByText, getByPlaceholderText } = render(<RefinementOptions />);

    // First refinement
    const textarea = getByPlaceholderText('Bijv: Maak de chorus vrolijker');
    fireEvent.change(textarea, { target: { value: 'Make it happier' } });
    fireEvent.click(getByText('Verfijn lyrics'));

    await waitFor(() => {
      expect(getByText('✓ Verfijnd (gebruikt)')).toBeInTheDocument();
    });

    // Second refinement should be disabled
    expect(getByText('Verfijn lyrics')).toBeDisabled();
  });
});
```

### E2E Tests (Playwright)

**Test: Complete happy path**
```typescript
test('User can generate, select, and proceed to music', async ({ page }) => {
  // 1. Complete conversation
  await page.goto('/studio');
  await page.fill('[data-testid="chat-input"]', 'Mijn partner heet Sarah');
  await page.click('[data-testid="send-button"]');
  // ... continue conversation

  // 2. Generate lyrics
  await page.click('text=Genereer Lyrics');
  await page.waitForSelector('text=Versie A', { timeout: 60000 });

  // 3. Select variant
  await page.click('text=Versie B >> .. >> text=Kies deze');
  await page.click('text=Gebruik geselecteerde lyrics');

  // 4. Proceed to parameters
  await page.click('text=Genereer Muziek');
  await page.waitForSelector('text=Bevestig & Genereer Muziek');

  // 5. Confirm parameters
  await page.click('text=Bevestig & Genereer Muziek');
  await page.waitForSelector('text=Muziek wordt gegenereerd');

  // Verify music generation started
  expect(page.url()).toContain('/studio');
});
```

---

## Documentation

### User-Facing Docs

**Update: Studio Guide**
- Add section: "Lyrics generatie met 2 varianten"
- Explain comparison process
- Document refinement (1x limit)
- Add screenshots of new UI

**Create: Lyrics Selection Best Practices**
- When to choose variant A vs B
- How to write effective refinement feedback
- When to manually edit vs refine

### Developer Docs

**Update: CLAUDE.md**
- Remove references to OpenRouter lyrics agent
- Document new Suno-only flow
- Add state management diagram
- Update API routes list

**Create: Suno Lyrics Integration Guide**
- Prompt formatting guidelines
- Callback vs polling decision tree
- Error handling patterns
- Cost optimization tips

---

## Rollout Plan

### Alpha Testing (Week 6)
- **Audience**: Internal team (5 people)
- **Features**: All features enabled
- **Success Criteria**:
  - 0 critical bugs
  - ≥95% lyrics generation success
  - ≤45s average time to variants

### Beta Testing (Week 7-8)
- **Audience**: 50 beta users
- **Features**: All features + analytics
- **Success Criteria**:
  - ≥90% variant selection rate
  - ≤30% refinement usage
  - ≥80% conversion to music
  - Positive feedback on clarity of flow

### Production Rollout (Week 9)
- **Audience**: All users
- **Rollout**: Gradual (25% → 50% → 100%)
- **Monitoring**:
  - Real-time error tracking
  - Analytics dashboard
  - User feedback collection

---

## Revision History

| Version | Date       | Author | Changes                                      |
|---------|------------|--------|----------------------------------------------|
| 1.0     | 2025-10-21 | Claude | Initial PRD creation based on user requirements |

---

**Approval Required:**
- [ ] Product Owner (Eric)
- [ ] Technical Lead
- [ ] QA Lead

**Status:** Draft - Ready for Review
