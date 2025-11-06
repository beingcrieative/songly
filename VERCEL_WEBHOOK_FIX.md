# Vercel Webhook/Callback Fix voor Preview Deployments

## Het Probleem

Preview deployments (branch deployments) in Vercel hebben standaard **Deployment Protection** enabled.
Dit betekent dat ALLE requests geblokkeerd worden met 401 Unauthorized, VOORDAT ze de middleware bereiken.

Dit blokkeert externe webhooks/callbacks zoals:
- Suno API callbacks
- Externe payment webhooks
- Third-party notifications

## Symptomen

- Callbacks krijgen 401 errors
- GEEN middleware logs in Vercel voor callback requests
- Andere requests werken wel en tonen middleware logs
- Preview deployment URL zoals: `songly-git-branch-name-xxx.vercel.app`

## De Oplossingen

### Oplossing 1: Gebruik Production Deployment (AANBEVOLEN)

Voor webhooks/callbacks moet je ALTIJD de **production deployment** gebruiken:

1. Merge je branch naar `main`
2. Wacht tot production deployment klaar is
3. Gebruik de production URL: `your-app.vercel.app` (zonder `git-branch` prefix)

### Oplossing 2: Disable Deployment Protection voor specifieke paths

⚠️ **Security Warning**: Dit maakt je preview deployment publiek toegankelijk!

In Vercel Dashboard:
1. Ga naar je project → Settings → Deployment Protection
2. Disable protection OF
3. Add "Bypass for Automation" en gebruik de bypass token in je webhook URL

### Oplossing 3: Vercel Protection Bypass

Als je absoluut preview deployments moet gebruiken voor callbacks:

**Via vercel.json:**
```json
{
  "headers": [
    {
      "source": "/api/suno/(.*)/callback",
      "headers": [
        {
          "key": "x-vercel-protection-bypass",
          "value": "your-bypass-token"
        }
      ]
    }
  ]
}
```

**Bypass Token krijgen:**
1. Vercel Dashboard → Project Settings → Deployment Protection
2. Enable "Bypass for Automation"
3. Copy de bypass token
4. Voeg toe aan callback URL: `?x-vercel-protection-bypass=token`

### Oplossing 4: Test met Production Branch

Create een `staging` of `preview-production` branch:
1. Merge je features naar `staging`
2. Deploy `staging` als Production environment
3. Test callbacks op staging
4. Merge naar `main` voor production

## Onze Aanbeveling

**Gebruik altijd production deployments voor externe webhooks/callbacks.**

Preview deployments zijn bedoeld voor:
- UI testing
- Manual QA
- Internal review

NIET voor:
- External webhooks
- Payment callbacks  
- Third-party integrations

## Implementatie

### Stap 1: Merge naar main

```bash
git checkout main
git merge claude/fix-notification-handler-011CUrxfG2EpyWryMwq1qZ7U
git push origin main
```

### Stap 2: Update Suno Callback URL

Vercel Environment Variables → Production:
```
SUNO_CALLBACK_URL=https://your-production-app.vercel.app/api/suno/callback
```

### Stap 3: Trigger Redeploy

Vercel Dashboard → Deployments → Production → Redeploy

## Verificatie

Test de callback URL:
```bash
curl -X POST https://your-production-app.vercel.app/api/suno/lyrics/callback \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Je zou een 200 response moeten krijgen (niet 401).

## Referenties

- [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [Vercel Protection Bypass](https://vercel.com/docs/security/deployment-protection#bypassing-deployment-protection)
- [Webhooks Best Practices](https://vercel.com/docs/functions/edge-middleware#webhooks)

