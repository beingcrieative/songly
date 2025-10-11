# Suno API Parameters (Streaks Integration)

Deze referentie bundelt alle Suno API-velden die we in Streaks gebruiken of voorbereiden. Basis-URL uit `prompts/sunomanual.md`: `https://api.sunoapi.org/api/v1`. Elke request moet een `Authorization: Bearer <SUNO_API_KEY>` header bevatten.

## POST `/generate` — Muziek genereren met aangeleverde lyrics

| Parameter | Type | Verplicht | Beschrijving | Hoe Streaks vult |
|-----------|------|-----------|--------------|------------------|
| `custom_mode` | boolean | ja | Activeert “custom prompt” modus zodat Suno de aangeleverde lyrics exact volgt. | Altijd `true`. |
| `prompt` | string | ja | Daadwerkelijk lyricsprompt. Voor vocal-versies voegen we een natuurlijke taal beschrijving toe (bijv. `Sung in Dutch by a warm female voice…`). | Op basis van gebruikerlyrics + `buildVocalDescription`. |
| `title` | string | nee | Tracktitel die in de Suno UI/metadata verschijnt. | Songtitel of fallback `Untitled Love Song`. |
| `tags` | string | nee, sterk aanbevolen | Komma-gescheiden stijl/mood/vocale tags (genre, tempo, instrumentation). Suno gebruikt dit als stylistische gids. | Start met `musicStyle`; breidt uit met vocal- en moodtags. |
| `model` | string | nee (default V5) | Modelversie (bv. `V5`, `V4_5PLUS`). Moet uppercase. | Gebruikerskeuze of `DEFAULT_SUNO_MODEL`. |
| `mv` | string | nee | Modelvariant voor oudere API’s. Suno verwacht dezelfde waarde als `model`. | Gekopieerd van `model`. |
| `make_instrumental` | boolean | nee | Vraag expliciet om een instrumental-only versie. | Vanuit gebruikersvoorkeur `makeInstrumental`. |
| `instrumental` | boolean | nee | Alias die oudere API’s nodig hebben naast `make_instrumental`. | Zelfde vlag als hierboven. |
| `callBackUrl` | string (URL) | ja voor tracking | URL die Suno aanroept wanneer er een (tussen)resultaat is. | Gebaseerd op `SUNO_CALLBACK_URL`, evt. met `songId` queryparam. |

### Headers
- `Authorization: Bearer <SUNO_API_KEY>`
- `Content-Type: application/json`

### Typische responsvelden
- `task_id` / `taskId`: referentie die we opslaan in `song.sunoTaskId`.
- `model` / `model_name`: bevestigt de gebruikte engine.
- `code`, `msg`/`message`: fout- of statusmelding.

## GET `/generate/get-music-generation-details`

| Query | Type | Verplicht | Beschrijving |
|-------|------|-----------|--------------|
| `task_id` | string | ja | ID ontvangen bij de POST. |

Respons bevat `data` → array met tracks. Belangrijke fields die wij consumeren:

- `state`: `pending`, `generating`, `complete`, `failed`.
- `audio_url`, `stream_audio_url`, `source_audio_url`, `source_stream_audio_url`.
- `video_url`, `image_url`.
- `title`, `lyrics`, `tags`, `prompt`, `duration`.
- `model_name`, `id`.

## Callback payload

Suno POST naar `callBackUrl` met payload:

```json
{
  "data": {
    "task_id": "...",
    "callbackType": "first" | "complete" | "...",
    "data": [
      {
        "id": "...",
        "state": "complete",
        "title": "...",
        "audio_url": "...",
        "stream_audio_url": "...",
        "image_url": "...",
        "duration": 178,
        "model_name": "V5",
        "prompt": "...",
        "tags": "..."
      }
    ]
  }
}
```

We normaliseren de track (`trackId`, audio-/stream-URL’s, metadata) voordat we `songs` en `sunoVariants` bijwerken.

## POST `/generate/add-instrumental`

| Parameter | Type | Verplicht | Beschrijving |
|-----------|------|-----------|--------------|
| `audio_file_url` | string (URL) | ja | Locatie van het geüploade stem- of melodie bestand. |
| `prompt` | string | nee | Tekstuele aanwijzingen voor sfeer/arrangement. |
| `tags` | string | nee | Komma-gescheiden stijl/mood tags. |
| `style_weight` | number | nee | Stuur hoe agressief Suno de tags/prompt volgt (hoger = sterker). |
| `mv` | string | ja | Modelversie (`V4_5PLUS` in huidige implementatie). |

Respons levert `task_id` dat je vervolgens met dezelfde status-endpoint kunt volgen.

## POST `/generate/add-vocals`

| Parameter | Type | Verplicht | Beschrijving |
|-----------|------|-----------|--------------|
| `audio_file_url` | string (URL) | ja | Instrumentale basis waarop AI-vocals moeten komen. |
| `prompt` | string | nee | Lyrics/stemaanwijzingen voor de gegenereerde zang. |
| `tags` | string | nee | Sfeer/genre/vocale tags. |
| `style_weight` | number | nee | Mate waarin Suno prompt/tags volgt. |
| `mv` | string | ja | Modelversie (`V4_5PLUS`). |

## Overige endpoints uit `sunomanual.md`

De handleiding verwijst ook naar aanvullende services (nog niet geïntegreerd):

- `boost-music-style` — past stijl van bestaande track aan.
- `convert-to-wav` — levert WAV-export.
- `cover-suno` — genereert albumartwork.
- `create-music-video` — maakt videoclip.
- `extend-music` — verlengt bestaande track.
- `generate-lyrics` — losse lyricgenerator.
- `separate-vocals-from-music` — vocal/instrument splitsing.
- `upload-and-cover-audio` — coverversie op basis van upload.

Voor uitbreiding moeten we de respectievelijke documentatie raadplegen (links staan in `prompts/sunomanual.md`) om veldnamen exact over te nemen. Bovenstaande tabellen zijn bevestigd met de huidige werkende implementatie in Streaks.

## Integratie-tips

1. **Voorkeuren centraal opslaan** — gebruik `song.generationParams` om taal, stem, mood, model en instrumental-flag te bewaren zodat de request builder consistente waarden heeft.
2. **Tags dynamisch samenstellen** — combineer muzieksstijl van de gebruiker met vocale descriptors en mood-tags voordat je de request verzendt.
3. **Callbacks loggen** — track `callbackType` en `state` om de UI responsief bij te werken (laden, klaar, mislukt).
4. **Foutafhandeling** — controleer `code`/`message` in responses en vertaal naar Nederlandstalige meldingen.
