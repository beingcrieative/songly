# Pull Request: Complete PWA Implementation for Mobile Installation

## Samenvatting

Deze PR implementeert volledige PWA (Progressive Web App) functionaliteit, waardoor de app installeerbaar is op zowel iOS/Safari als Android/Chrome met een native look-and-feel.

## Probleem

De app had PWA-bestanden maar was niet installeerbaar omdat:
- ❌ Manifest gebruikte incorrect SVG icons (Next.js/Vercel logo's)
- ❌ Geen iOS/Safari meta tags voor standalone mode
- ❌ Geen Apple Touch Icons voor iOS home screen
- ❌ InstallPrompt component was niet geactiveerd
- ❌ Geen iOS-specifieke installatie instructies

## Oplossing

### 1. PWA Icons Gegenereerd
- ✅ 8 PWA icons in PNG formaat (72px - 512px)
- ✅ 5 Apple Touch Icons voor iOS (120px - 180px)
- ✅ 2 favicons (16x16, 32x32)
- ✅ App icon met hart + muziek thema (#FF1744)
- ✅ Icon generation script (`scripts/generate-pwa-icons.mjs`)

### 2. Manifest Configuratie
- ✅ Vervangen SVG icons met correcte PNG icons
- ✅ Maskable icons voor adaptive Android icons
- ✅ Theme color: #FF1744
- ✅ Orientation, categories, description toegevoegd

### 3. iOS/Safari Ondersteuning
- ✅ Viewport meta tag met `viewportFit: 'cover'`
- ✅ `apple-mobile-web-app-capable` voor standalone mode
- ✅ `apple-mobile-web-app-status-bar-style` voor statusbalk
- ✅ Apple Touch Icons in metadata
- ✅ Theme color meta tag

### 4. Install Prompt Verbeteringen
- ✅ iOS detectie en standalone mode check
- ✅ iOS-specifieke installatie instructies (Safari Share menu)
- ✅ Chrome/Android native install prompt
- ✅ 7-dagen dismissal tracking
- ✅ 3 seconden delay voor iOS prompt
- ✅ Geactiveerd in ClientBoot component

### 5. Code Cleanup
- ✅ Verwijderd dubbel ServiceWorkerRegister uit library page
- ✅ Gecentraliseerd in ClientBoot

## Testing Instructies

### iOS/Safari
1. Open app in Safari op iPhone/iPad
2. Wacht 3 seconden voor install instructies
3. Volg instructies: Share → "Zet op beginscherm" → "Voeg toe"
4. Open van home screen - standalone mode zonder Safari UI ✓

### Android/Chrome
1. Open app in Chrome
2. Wacht op "Installeer de app" prompt (of Chrome menu → "App installeren")
3. Tap "Installeren"
4. Open van home screen - standalone mode zonder Chrome UI ✓

### Verificatie
- ✅ App icon op home screen
- ✅ Geen browser UI (adresbalk) bij openen
- ✅ Statusbalk integreert met app
- ✅ App naam: "Liefdesliedje Studio"
- ✅ Standalone mode actief

## Technische Details

**Bestanden toegevoegd:**
- `public/app-icon.svg` - Source icon
- `public/icon-*.png` - 8 PWA icons
- `public/apple-touch-icon*.png` - 5 iOS icons
- `public/favicon-*.png` - 2 favicons
- `scripts/generate-pwa-icons.mjs` - Icon generator

**Bestanden gewijzigd:**
- `public/manifest.webmanifest` - Correcte icon configuratie
- `src/app/layout.tsx` - iOS meta tags + viewport
- `src/components/ClientBoot.tsx` - InstallPrompt geactiveerd
- `src/components/pwa/InstallPrompt.tsx` - iOS support toegevoegd
- `src/app/library/page.tsx` - Cleanup dubbel component
- `package.json` - sharp dependency toegevoegd

## Dependencies

- `sharp` (dev) - Voor icon generatie uit SVG

## Breaking Changes

Geen breaking changes.

## Screenshots

Na installatie op iOS:
- App icon met hart + muziek symbool op home screen
- App opent zonder Safari interface
- Statusbalk integreert met app thema

Na installatie op Android:
- App icon in app drawer
- App opent zonder Chrome interface
- Adaptive icon met maskable support

## Checklist

- [x] Icons gegenereerd in alle vereiste formaten
- [x] Manifest updated met correcte configuratie
- [x] iOS meta tags toegevoegd
- [x] Install prompt werkt op beide platformen
- [x] Service worker registreert correct
- [x] Build slaagt zonder errors
- [x] Code cleanup uitgevoerd

## Notes

- iOS gebruikt handmatige installatie via Share menu (geen automatic prompt API)
- Install prompt toont na 3 seconden en kan voor 7 dagen dismissed worden
- App icon kan aangepast worden door `app-icon.svg` te bewerken en script opnieuw te draaien

🤖 Generated with [Claude Code](https://claude.com/claude-code)
