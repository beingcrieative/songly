# 💕 Liefdesliedje Maker - MVP

Een Next.js applicatie waarmee gebruikers gepersonaliseerde liefdesliedjes kunnen genereren via een AI-gestuurde chat interface.

## Features

### ✅ Geïmplementeerd in MVP

1. **Chatgestuurde AI-agent**
   - 5 gerichte vragen over de relatie
   - Natuurlijke conversatie flow
   - Realtime opslag in InstantDB

2. **AI Lyrics Generatie**
   - OpenRouter model: `openai/gpt-oss-20b:free` (gratis) voor het schrijven van persoonlijke songteksten
   - Structuur: couplet, refrein, bridge
   - Gebaseerd op gebruikers antwoorden

3. **Muziek Generatie**
   - Integratie met Suno AI API (v4)
   - Automatische muziekcompositie op basis van lyrics
   - Polling systeem voor status updates

4. **Muziek Speler**
   - Ingebouwde audio player
   - Download functie (MP3)
   - Deel functie (Web Share API)
   - Lyrics weergave

5. **Authenticatie**
   - Magic code login via InstantDB
   - Beveiligde gebruikerssessies

6. **Database**
   - InstantDB realtime database
   - Entities: conversations, messages, songs
   - Type-safe queries met TypeScript

## Technische Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: InstantDB (realtime)
- **AI Lyrics**: OpenRouter (`openai/gpt-oss-20b:free` - gratis!)
- **Music**: Suno AI API
- **Auth**: InstantDB Magic Codes

## Setup

### 1. Environment Variables

Vul de `.env` file in met je API keys:

```bash
# InstantDB (already configured)
NEXT_PUBLIC_INSTANT_APP_ID=38076a85-d3e4-47ce-972a-079962f6cb9b
INSTANT_APP_ADMIN_TOKEN=9628446a-fde8-4fd4-a333-a77ef1e287ef

# OpenRouter API Key (already configured - FREE tier!)
OPENROUTER_API_KEY=sk-or-v1-...
# Optional: override model (default is openai/gpt-oss-20b:free)
# OPENROUTER_MODEL=openai/gpt-oss-20b:free

# Suno API Key (already configured)
SUNO_API_KEY=ed1d9fbbab21bc78e944027e5d31b290
SUNO_CALLBACK_URL=https://b82c38edc9cb.ngrok-free.app/api/suno/callback
```

**Note**: Alle API keys zijn al geconfigureerd in de `.env` file!

### 2. Installeer Dependencies

```bash
npm install
```

### 2b. Suno callback

- Het endpoint `src/app/api/suno/callback/route.ts` ontvangt webhook-updates van Suno met variantinformatie (stream/audio URL's, covers, duur).
- Tijdens lokale ontwikkeling kun je een tunnel gebruiken, bijvoorbeeld:
  ```bash
  ngrok http 3000
  export SUNO_CALLBACK_URL="https://<ngrok-domain>.ngrok-free.app/api/suno/callback"
  npm run dev
  ```
- Voor productie moet `SUNO_CALLBACK_URL` verwijzen naar jouw publieke domein zodat Suno de callback kan bereiken.
- Om oude generaties opnieuw te indexeren kun je de backfill-trigger aanroepen (na het updaten van `INSTANT_APP_ADMIN_TOKEN`/`BACKFILL_SECRET`):
  ```bash
  curl -X POST "http://localhost:3000/api/admin/backfill-suno?token=$INSTANT_APP_ADMIN_TOKEN"
  ```

### 3. Push Database Schema

```bash
# Je moet eerst inloggen bij InstantDB
npx instant-cli login

# Push het schema
npx instant-cli push
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Gebruikersflow

1. **Login**: Gebruiker voert email in en ontvangt magic code
2. **Start Gesprek**: Klik op "Start je liefdesliedje"
3. **Beantwoord Vragen**: AI stelt 5 vragen:
   - Bijzondere herinnering
   - Eigenschap die je bewondert
   - Gevoel dat je wilt overbrengen
   - Wat jullie relatie uniek maakt
   - Muziekstijl voorkeur
4. **Lyrics Generatie**: `openai/gpt-oss-20b:free` genereert persoonlijke songtekst via OpenRouter
5. **Muziek Generatie**: Suno AI creëert de muziek (30-60 seconden)
6. **Resultaat**: Luister, download en deel je liefdesliedje

## API Routes

### `/api/chat` (POST)
- Handelt de conversatie flow
- Stuurt vragen of genereert lyrics via OpenRouter (DeepSeek)
- Input: `{ messages, currentStep }`
- Output: `{ type: 'question'|'lyrics', content, ... }`

### `/api/suno` (POST)
- Start muziek generatie
- Input: `{ title, lyrics, musicStyle }`
- Output: `{ taskId, status }`

### `/api/suno` (GET)
- Check muziek status
- Query: `?taskId=...`
- Output: `{ status, audioUrl, videoUrl }`

## Database Schema

```typescript
entities: {
  conversations: {
    createdAt: number (indexed)
    status: string (indexed) // 'active' | 'generating_lyrics' | 'generating_music' | 'completed'
    currentStep: number
  }

  messages: {
    role: string // 'user' | 'assistant'
    content: string
    createdAt: number (indexed)
  }

  songs: {
    title: string
    lyrics: string
    musicStyle: string
    sunoTaskId: string (optional)
    audioUrl: string (optional)
    videoUrl: string (optional)
    status: string (indexed) // 'generating' | 'ready' | 'failed'
    createdAt: number (indexed)
  }
}

links: {
  conversation → user ($users)
  message → conversation
  song → conversation
  song → user
}
```

## Belangrijke Bestanden

- `src/instant.schema.ts` - Database schema definitie
- `src/app/page.tsx` - Hoofdapplicatie (chat UI + logic)
- `src/app/api/chat/route.ts` - OpenRouter integratie voor lyrics (model via `OPENROUTER_MODEL`)
- `src/app/api/suno/route.ts` - Suno muziek generatie
- `src/lib/db.ts` - InstantDB client

## Suno API Documentatie

De app gebruikt de volgende Suno API endpoints:
- Create Music: `POST /api/v1/gateway/generate/music`
- Get Status: `GET /api/v1/gateway/query?ids={taskId}`

Zie `prompts/sunomanual.md` voor volledige API documentatie.

## Beperkingen MVP

- Geen history/lijst van eerder gemaakte liedjes (kan toegevoegd worden)
- Geen bewerken van lyrics na generatie
- Geen keuze tussen verschillende muziekstijlen tijdens generatie
- Polling kan geoptimaliseerd worden met webhooks
- Geen error recovery bij gefaalde muziek generatie

## Volgende Stappen

1. **User Testing**: Test met echte gebruikers
2. **Error Handling**: Betere foutafhandeling en retry logic
3. **UI Polish**: Animaties, loading states, betere UX
4. **Features**:
   - Geschiedenis van gemaakte liedjes
   - Lyrics editing
   - Meerdere muziekstijl opties
   - Album cover generatie
   - Social sharing preview
5. **Performance**:
   - Caching van API responses
   - Webhooks i.p.v. polling
   - Optimistic UI updates

## Support

- InstantDB Docs: https://instantdb.com/docs
- Suno API Docs: https://docs.sunoapi.com
- OpenRouter Docs: https://openrouter.ai/docs
- OpenRouter Docs: https://openrouter.ai/docs

---

**Gebouwd met ❤️ voor het maken van gepersonaliseerde liefdesliedjes**
