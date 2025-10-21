# Suno Music UI Spec (PWA Studio)

This spec defines the end‑user controls to influence Suno music generation, the UI layout (wireframes), allowed values, and backend mappings. It reflects the current integration in \ and templates in \.

## 1) Controls Overview (User‑Facing)
- Title
  - Type: text. Default: “Liefdesliedje”.
  - Maps: \ (string).
- Lyrics (Prompt)
  - Source: selected lyrics (read‑only). We append a vocal description unless instrumental.
  - Maps: \ (string).
- Template (Style/Tags)
  - Type: card select (e.g., “Romantische Ballad”, “Vrolijke Pop”).
  - Maps: \ (base tags from template) + optional mood/vocal tags.
- Instrumental
  - Type: toggle.
  - Maps: \ + \ (boolean). If true, omit vocal description.
- Language
  - Type: select (e.g., Nederlands, Engels).
  - Maps: contributes to vocal description/tags (not a direct API field).
- Vocal Gender
  - Type: segmented (male, female, neutral).
  - Maps: contributes to vocal description/tags.
- Vocal Age/Timbre
  - Type: segmented (young, mature, deep).
  - Maps: contributes to vocal description/tags.

### Advanced (sliders: 0–100% → 0.00–1.00)
- Style Weight → \
  - Help: “Hoe sterk de muziek de gekozen stijl/tags volgt.”
  - Hints: 20% veilig, 50% gebalanceerd, 80% uitgesproken.
- Weirdness Constraint → \
  - Help: “Creativiteit t.o.v. voorspelbaarheid.” Lager = veiliger, hoger = experimenteler.
- Audio Weight → \
  - Help: “Audiofeel t.o.v. lyrische prompt.” Hoger = meer focus op feel/arrangement.

Note on Model: Shown as read‑only “Model: V5”. Backend sends \ and \ as \.

## 2) Parameter Sheet (Wireframe)
\\\

## 3) Backend Mapping (Generate)
We send (simplified):
- \: lyrics (+ vocal description if vocals)
- \: user title
- \: template tags + mood/vocal tags
- \ / \: \
- \ + \: from toggle
- \, \, \: from sliders (0–1)
- \: system‑managed

## 4) Allowed Values & Defaults
- Style Weight: 0.00–1.00 (default per template; e.g., 0.8–0.9)
- Weirdness Constraint: 0.00–1.00 (default per template; e.g., 0.2–0.5)
- Audio Weight: 0.00–1.00 (default per template; e.g., 0.5–0.7)
- Language: { Nederlands, Engels } (extendable)
- Vocal Gender: { male, female, neutral }
- Vocal Age/Timbre: { young, mature, deep }

## 5) Not Currently Supported (API/Backend)
The current backend integration and observed responses do not include discrete fields for:
- BPM/Tempo, Musical Key/Scale, Time Signature, Sections/Structure.
- If Suno API provides these in newer endpoints, we can add optional UI controls and map them once backend is extended. For now: not exposed to users.

## 6) Optional/Template Fields
- Negative Tags: defined on templates but not forwarded by default. If needed, append to \ as “avoid …”.

## 7) Copy Guidance (Tooltips)
- Style Weight: “Lager = vrijer van stijl; hoger = dichter bij gekozen template.”
- Weirdness: “Lager = veilig/voorspelbaar; hoger = creatief/experimenteel.”
- Audio Weight: “Lager = volg tekst/lyrics sterker; hoger = focus op sound/feel.”
- Instrumental: “Zonder zang; geschikt voor achtergrondmuziek.”

## 8) Open Items for Designer & Dev
- Consider a compact “Basic vs Geavanceerd” toggle to prevent overwhelm.
- Visual affordances for defaults per template (Reset‑to‑template control).
- If Suno publishes BPM/Key controls: design sliders/selects now (disabled state), enable when backend adds support.

## 9) References
- Code: \ (fields sent).
- Templates: \ (defaults & ranges).
- Lyrics API wrapper: \.
