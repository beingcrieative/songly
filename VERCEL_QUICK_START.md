# ⚡ Vercel Quick Start - Songly PWA

## 🎯 TL;DR - Minimale Setup

### Stap 1: Deploy naar Vercel
```bash
# Ga naar: https://vercel.com/new
# Importeer: beingcrieative/songly
# Laat build settings op default
```

### Stap 2: Voeg Environment Variables toe

In Vercel Dashboard → Settings → Environment Variables, voeg toe:

```bash
# === REQUIRED ===
NEXT_PUBLIC_INSTANT_APP_ID=38076a85-d3e4-47ce-972a-079962f6cb9b
INSTANT_APP_ADMIN_TOKEN=1c3c1acb-645c-4d37-bfc7-9c9b88b55e71
SUNO_API_KEY=ed1d9fbbab21bc78e944027e5d31b290

# === CRITICAL - UPDATE NA EERSTE DEPLOY ===
SUNO_CALLBACK_URL=https://TEMP.vercel.app/api/suno/callback
NEXT_PUBLIC_BASE_URL=https://TEMP.vercel.app

# === OPTIONAL ===
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=google/gemini-2.5-flash-lite
BACKFILL_SECRET=1c3c1acb-645c-4d37-bfc7-9c9b88b55e71
INSTANT_CLI_AUTH_TOKEN=bfa531b5-e5b1-4f7e-b4a9-311251998951

# === FEATURE FLAGS ===
NEXT_PUBLIC_MIN_CONVERSATION_ROUNDS=6
NEXT_PUBLIC_MAX_CONVERSATION_ROUNDS=10
NEXT_PUBLIC_ENABLE_TWO_AGENT_SYSTEM=true
NEXT_PUBLIC_ENABLE_LYRICS_COMPARE=true
NEXT_PUBLIC_DEV_MODE=false
```

### Stap 3: Deploy en Krijg Je URL

Klik "Deploy". Na ~2 minuten krijg je een URL zoals: `songly-xxx.vercel.app`

### Stap 4: Update Callback URLs

1. Kopieer je Vercel URL
2. Ga terug naar Settings → Environment Variables
3. Update deze 2 variables:

```bash
SUNO_CALLBACK_URL=https://songly-xxx.vercel.app/api/suno/callback
NEXT_PUBLIC_BASE_URL=https://songly-xxx.vercel.app
```

4. Klik "Redeploy" (onder Deployments tab)

### ✅ Klaar!

Je PWA draait nu op: `https://songly-xxx.vercel.app`

---

## 🌐 Custom Domain? (Optioneel)

Als je je eigen domain wilt (bijv. `songly.app`):

1. Vercel Dashboard → Settings → Domains
2. Voeg domain toe
3. Update DNS bij je domain provider (A-record of CNAME)
4. Wacht 5-60 minuten voor propagatie
5. Update environment variables NOGMAALS:
   ```bash
   SUNO_CALLBACK_URL=https://songly.app/api/suno/callback
   NEXT_PUBLIC_BASE_URL=https://songly.app
   ```
6. Redeploy

---

## ❓ Waarom 2x deployen?

De Suno API heeft een **publiek bereikbare callback URL** nodig om resultaten terug te sturen. Je weet deze URL pas NADAT je eerste deployment klaar is.

**Workflow:**
1. 🚀 Deploy 1: Krijg Vercel URL
2. 🔧 Update: Vul echte URL in environment variables
3. 🚀 Deploy 2: Nu met werkende callbacks

---

## 🐛 Problemen?

### "Callback URL not set" error
→ Check of `SUNO_CALLBACK_URL` ingevuld is in Vercel Environment Variables

### Suno callbacks komen niet binnen
→ Check Vercel Function Logs (Deployments → Functions)
→ Verify dat URL publiek bereikbaar is

### CORS errors
→ Check dat `NEXT_PUBLIC_BASE_URL` correct is
→ Zorg dat het je production domain is (niet preview URL)

Voor meer details: zie [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
