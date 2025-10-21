# Suno Music Generation – Parameters & UI Guidance

This doc outlines which options we expose in the GUI to influence Suno’s music generation and how they map to the API body sent by `src/app/api/suno/route.ts`.

## 1) Core Inputs (Required/Primary)
- Title (`title: string`)
  - UI: text input. Used as track title.
- Lyrics/Prompt (`prompt: string`)
  - UI: read‑only from selected lyrics; we append a vocal description if vocals are enabled.
- Style/Tags (`tags: string`)
  - UI: template select (e.g., Romantic Ballad, Upbeat Pop). May show “mood” chips to append extra tags.
- Model (`model` / `mv`)
  - Forced to `V5` in code. UI can show read‑only “Model: V5”.
- Instrumental (`make_instrumental` / `instrumental: boolean`)
  - UI: toggle “Instrumentaal”. If true, we do not append vocal description.

## 2) Vocal Preferences (Merged)
- Language (`language: string`)
  - UI: select (e.g., Nederlands/Engels). Used in vocal description/tags.
- Vocal Gender (`vocalGender: 'male'|'female'|'neutral'`)
- Vocal Age/Timbre (`vocalAge: 'young'|'mature'|'deep'`)
- Free description (`vocalDescription: string`)
  - All above shape the appended description (see `buildVocalDescription` and `buildVocalTags`).

## 3) Advanced (Template Config → API)
- Style Weight → `style_weight: number` (0.00–1.00)
  - UI: slider 0–100% (map to 0–1). Higher = adhere more to style/tags.
- Weirdness Constraint → `weirdness_constraint: number` (0.00–1.00)
  - UI: slider 0–100%. Lower = safer/predictable, Higher = more creative.
- Audio Weight → `audio_weight: number` (0.00–1.00)
  - UI: slider 0–100%. Higher = focus more on audio feel vs. lyrical guidance.
- Negative Tags (optional)
  - Present in templates but not currently forwarded. If needed, append to `tags` as comma‑separated “avoid …”.

## 4) Backend Request (Generate)
We send (simplified):
```json
{
  "custom_mode": true,
  "prompt": "<lyrics>\n\n<vocal_description>",
  "title": "<title>",
  "tags": "<template.tags>, <mood>, <vocal_tags>",
  "model": "V5",
  "mv": "V5",
  "make_instrumental": false,
  "instrumental": false,
  "style_weight": 0.85,
  "weirdness_constraint": 0.3,
  "audio_weight": 0.6,
  "callBackUrl": "<PUBLIC_CALLBACK>?songId=<id>"
}
```
Notes:
- `model/mv` forced to `V5`.
- If instrumental: both booleans true and no vocal description.

## 5) Lyrics Generation (Reference)
- Endpoint: `/api/suno/lyrics` wraps Suno lyrics API.
- Inputs: `prompt` or `previousLyrics + feedback` (for refinement), `callBackUrl`.
- Returns `taskId` → polled by `/api/suno/lyrics?taskId=...`.

## 6) Recommended GUI Controls
- Basic: Title (text), Template (cards), Instrumental (toggle), Language (select), Vocal Gender/Age (segmented), Mood (chips).
- Advanced: 3 sliders (Style Weight, Weirdness, Audio Weight) with helper copy and reset‑to‑template.
- Contextual help tooltips for each advanced slider with value hints (0.2 safe, 0.5 balanced, 0.8 bold).

## 7) Limits & Caveats
- No BPM/Key controls in current API usage.
- `negativeTags` not forwarded by default—implement as tag append if needed.
- Model selection optional; keep default `V5` for consistency.

