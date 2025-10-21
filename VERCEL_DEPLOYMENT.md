# Vercel Deployment Instructies voor Songly PWA

## 📋 Environment Variables Setup

Je app gebruikt **3 URL-gerelateerde environment variables** die aangepast moeten worden voor Vercel:

### 1. Server-side Callback (CRITICAL!)
```bash
SUNO_CALLBACK_URL=https://your-domain.com/api/suno/callback
```
- **Wat het doet**: Suno stuurt naar deze URL als een liedje klaar is
- **Moet**: Een publiek bereikbare URL zijn (Vercel deployment URL)

### 2. Client-side Base URL
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```
- **Wat het doet**: Gebruikt in de frontend voor API calls
- **Moet**: Je productie domain zijn (zonder trailing slash)

### 3. Client-side Callback Origin (optioneel)
```bash
NEXT_PUBLIC_SUNO_CALLBACK_ORIGIN=https://your-domain.com
```
- **Wat het doet**: Fallback voor lyrics callbacks vanuit de client
- **Best practice**: Laat leeg of zelfde als `NEXT_PUBLIC_BASE_URL`

---

## 🚀 Stap-voor-stap Vercel Setup

### Stap 1: Eerste Deployment (om je URL te krijgen)

1. Ga naar https://vercel.com/new
2. Importeer je GitHub repository: `beingcrieative/songly`
3. Laat de build settings op default (Vercel detecteert Next.js automatisch)
4. **Voeg TIJDELIJK deze environment variables toe** (Production):

```bash
# InstantDB
NEXT_PUBLIC_INSTANT_APP_ID=38076a85-d3e4-47ce-972a-079962f6cb9b
INSTANT_APP_ADMIN_TOKEN=1c3c1acb-645c-4d37-bfc7-9c9b88b55e71
INSTANT_CLI_AUTH_TOKEN=bfa531b5-e5b1-4f7e-b4a9-311251998951

# OpenRouter AI
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=google/gemini-2.5-flash-lite

# Suno API
SUNO_API_KEY=ed1d9fbbab21bc78e944027e5d31b290
SUNO_CALLBACK_URL=https://PLACEHOLDER.vercel.app/api/suno/callback

# Backfill
BACKFILL_SECRET=1c3c1acb-645c-4d37-bfc7-9c9b88b55e71

# Conversation Flow
NEXT_PUBLIC_MIN_CONVERSATION_ROUNDS=6
NEXT_PUBLIC_MAX_CONVERSATION_ROUNDS=10

# Feature Flags
NEXT_PUBLIC_ENABLE_TWO_AGENT_SYSTEM=true
NEXT_PUBLIC_ENABLE_LYRICS_COMPARE=true

# Development
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_BASE_URL=https://PLACEHOLDER.vercel.app
```

5. Klik op "Deploy"

### Stap 2: Update URLs met je echte deployment URL

Na de eerste deployment krijg je een URL zoals:
- `songly-xxx.vercel.app` (automatisch gegenereerd)
- OF je custom domain als je die hebt ingesteld

1. Ga naar je project in Vercel Dashboard
2. Navigeer naar **Settings** → **Environment Variables**
3. Update de volgende variables:

```bash
SUNO_CALLBACK_URL=https://songly-xxx.vercel.app/api/suno/callback
NEXT_PUBLIC_BASE_URL=https://songly-xxx.vercel.app
```

4. **Klik op "Redeploy"** (onder Deployments tab)

---

## 🌐 Custom Domain Setup (Optioneel maar Aanbevolen)

### Als je een eigen domain hebt (bijv. songly.app):

1. **Vercel Dashboard** → **Settings** → **Domains**
2. Voeg je domain toe (bijv. `songly.app`)
3. Volg de DNS instructies (voeg A-record of CNAME toe bij je domain provider)
4. Wacht tot domain verified is (kan 5-60 minuten duren)
5. **Update environment variables OPNIEUW**:

```bash
SUNO_CALLBACK_URL=https://songly.app/api/suno/callback
NEXT_PUBLIC_BASE_URL=https://songly.app
```

6. Redeploy

---

## ⚙️ Automatische URL Detection (Geavanceerd)

Als je wilt dat de app automatisch de juiste URL detecteert zonder hardcoded values, kun je dit gebruiken:

### Server-side Route aanpassing
In `src/app/api/suno/route.ts` kun je de callback URL dynamisch bepalen:

```typescript
// In plaats van hardcoded SUNO_CALLBACK_URL
const getCallbackUrl = (songId?: string) => {
  const baseUrl = process.env.SUNO_CALLBACK_URL ||
                  `https://${process.env.VERCEL_URL}` ||
                  'http://localhost:3000';

  const callbackPath = '/api/suno/callback';
  const fullUrl = baseUrl + callbackPath;

  return songId
    ? `${fullUrl}?songId=${encodeURIComponent(songId)}`
    : fullUrl;
};
```

### Client-side URL detection
Voor `NEXT_PUBLIC_BASE_URL` kun je een helper functie maken:

```typescript
// src/lib/utils/getBaseUrl.ts
export function getBaseUrl(): string {
  // 1. Expliciet ingestelde URL (hoogste prioriteit)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // 2. Browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 3. Vercel environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 4. Development fallback
  return 'http://localhost:3000';
}
```

---

## ✅ Verificatie Checklist

Na deployment, test deze endpoints:

1. **Homepage redirect**: `https://your-domain.com/` → moet redirecten naar `/studio`
2. **Studio page**: `https://your-domain.com/studio` → moet laden
3. **Library page**: `https://your-domain.com/library` → moet laden
4. **Suno callback**: `https://your-domain.com/api/suno/callback` → moet 405 geven (POST only)

### Test Suno Callback
In de Vercel Function Logs (Real-time logs) kun je zien of callbacks binnenkomen:

```bash
# Als je een liedje genereert, zou je moeten zien:
POST /api/suno/callback?songId=xxx
```

---

## 🔧 Troubleshooting

### "Callback URL not set" error
- Check of `SUNO_CALLBACK_URL` correct is ingesteld in Vercel Environment Variables
- Zorg dat het GEEN trailing slash heeft
- Must start with `https://` (niet `http://`)

### Suno callbacks komen niet binnen
1. Check Vercel Function Logs voor errors
2. Verify dat je URL publiek bereikbaar is (test met curl/Postman)
3. Check of Suno API key geldig is
4. Verify dat callback URL exact match met wat je in Suno stuurt

### CORS errors in browser
- Zorg dat `NEXT_PUBLIC_BASE_URL` correct is
- Check dat je domain niet in de Vercel preview URL zit (gebruik production URL)

---

## 📝 Environment Variables Overzicht

### Required (Zonder deze werkt de app niet):
- `NEXT_PUBLIC_INSTANT_APP_ID` - InstantDB database ID
- `INSTANT_APP_ADMIN_TOKEN` - InstantDB admin access
- `SUNO_API_KEY` - Suno music generation API key
- `SUNO_CALLBACK_URL` - Waar Suno resultaten naartoe stuurt
- `NEXT_PUBLIC_BASE_URL` - Je productie domain

### Optional maar aanbevolen:
- `OPENROUTER_API_KEY` - AI conversational agent
- `BACKFILL_SECRET` - Voor admin endpoints
- Feature flags (NEXT_PUBLIC_ENABLE_*)

### Development only (niet nodig in production):
- `NEXT_PUBLIC_DEV_MODE` - Moet `false` zijn in production
- `INSTANT_CLI_AUTH_TOKEN` - Alleen voor lokale schema updates

---

## 🔒 Security Notes

**BELANGRIJK**: Commit NOOIT je echte API keys naar Git!

De `.env` file staat in `.gitignore`, maar Vercel Environment Variables zijn veilig opgeslagen in hun dashboard.

Voor team collaboration:
1. Gebruik Vercel Teams om environment variables te delen
2. Of gebruik een password manager voor team secrets
3. Roteer keys regelmatig
