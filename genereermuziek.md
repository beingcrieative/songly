# Template Preview Audio Generatie Instructies

## Overzicht
Genereer 3 instrumental preview clips (30 seconden) voor de music templates via Suno API.

## Suno API Calls

### 🎹 Template 1: Romantische Ballad
```bash
curl -X POST "https://api.sunoapi.org/api/v1/generate" \
  -H "Authorization: Bearer $SUNO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_mode": true,
    "instrumental": true,
    "title": "Romantische Ballad Preview",
    "style": "slow romantic ballad with piano and strings",
    "tags": "ballad, romantic, emotional, piano, orchestral",
    "model": "V5"
  }'
```

### 🎵 Template 2: Vrolijke Pop
```bash
curl -X POST "https://api.sunoapi.org/api/v1/generate" \
  -H "Authorization: Bearer $SUNO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_mode": true,
    "instrumental": true,
    "title": "Vrolijke Pop Preview",
    "style": "upbeat modern pop with synths and drums",
    "tags": "pop, upbeat, catchy, energetic, modern",
    "model": "V5"
  }'
```

### 🎸 Template 3: Akoestisch Intiem
```bash
curl -X POST "https://api.sunoapi.org/api/v1/generate" \
  -H "Authorization: Bearer $SUNO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_mode": true,
    "instrumental": true,
    "title": "Akoestisch Intiem Preview",
    "style": "soft acoustic guitar ballad, intimate and warm",
    "tags": "acoustic, intimate, guitar, soft, warm, personal",
    "model": "V5"
  }'
```

## Bestandslocaties

Na generatie, download en sla de audio op in `public/templates/`:

```
public/templates/romantic-ballad-preview.mp3
public/templates/upbeat-pop-preview.mp3
public/templates/acoustic-intimate-preview.mp3
```

## Cover Images

Voeg ook placeholder cover images toe:

```
public/templates/romantic-ballad-cover.jpg
public/templates/upbeat-pop-cover.jpg
public/templates/acoustic-intimate-cover.jpg
public/templates/surprise-me-cover.jpg
```

## Tips

- Gebruik de eerste 30 seconden van elke gegenereerde track
- Zorg dat de audio gecomprimeerd is (~200KB per file voor performance)
- Test de preview audio in de browser voordat je verder gaat
