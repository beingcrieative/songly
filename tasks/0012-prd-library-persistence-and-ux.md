# PRD — Bibliotheek (Library) voor ingelogde gebruikers

## 1. Overzicht
Ingelogde gebruikers moeten hun afgeronde gesprekken (samenvattingen) en gegenereerde liedjes kunnen terugvinden op de pagina `/library`. Deze bibliotheek fungeert als centrale plek om resultaten te bewaren, terug te luisteren en opnieuw te openen in de Studio. Alleen ingelogde gebruikers hebben toegang; items zijn privé, met optionele deelbare links voor nummers.

Deze PRD beschrijft doelen, user stories, functionele eisen, UI/UX opzet, technische aandachtspunten (InstantDB), en acceptatiecriteria.

## 2. Doelen
- (G1) Alleen “gefinaliseerde” resultaten opslaan/tonen in Library (geen ruwe chatlog).
- (G2) Gesprekken opslaan als samenvattingen: concept‑lyrics versies, extracted context, readiness‑score.
- (G3) Liedjes opslaan met alle varianten; gebruiker kan een “geselecteerde” variant markeren.
- (G4) Bibliotheek UI met twee tabs: “Gesprekken” en “Liedjes”.
- (G5) Ingelogde sessie verplicht voor Library en onderliggende API’s.
- (G6) Mini‑player afspelen binnen PWA en basis offline caching voor audio/cover.
- (G7) Hard‑delete van items door gebruiker.
- (G8) Deelbare read‑only links voor liedjes.

## 3. User Stories
1) Als ingelogde gebruiker wil ik mijn afgeronde gesprekken zien, zodat ik later kan terugkijken welke richting en lyrics‑concepten we hebben bereikt.
2) Als ingelogde gebruiker wil ik al mijn gegenereerde liedjes (en varianten) zien, ze kunnen afspelen, en een variant als “geselecteerd” markeren.
3) Als ingelogde gebruiker wil ik vanuit de Library een item openen in de Studio met context (gesprek of liedje) voorgeladen.
4) Als ingelogde gebruiker wil ik een liedje publiek kunnen delen via een read‑only link.
5) Als ingelogde gebruiker wil ik items doorzoeken, sorteren en filteren zodat ik snel vind wat ik nodig heb.
6) Als ingelogde gebruiker wil ik items kunnen verwijderen.

## 4. Functionele Eisen (genummerd)
1) Library toegang
   - 1.1 Alleen beschikbaar voor ingelogde gebruikers (sessie verplicht; middleware + API‑checks).
   - 1.2 Unauthorized → redirect naar login of duidelijke fout.

2) Tabs & Navigatie
   - 2.1 Twee tabs: “Gesprekken” en “Liedjes”.
   - 2.2 URL blijft `/library`; tabstatus client‑side of queryparam (`?tab=songs`).

3) Gesprekken (samenvattingen, geen full chat)
   - 3.1 Opslaan bij afronding of overgang naar generating/complete: concept‑lyrics (laatste versie) + versiegeschiedenis, extracted context, readiness score, timestamp.
   - 3.2 Lijst toont: titel (afgeleid uit concept‑lyrics), laatste update, readiness%, korte snippet.
   - 3.3 Detailpaneel: toon concept‑lyrics geschiedenis (v1..vN) en context; actie “Open in Studio”.

4) Liedjes
   - 4.1 Opslaan van ALLE varianten per liedje, inclusief velden: `title`, `imageUrl`, `streamAudioUrl`, `audioUrl`, `durationSeconds`, `modelName`, `tags`, `order`.
   - 4.2 Eén variant kan op “geselecteerd” staan (boolean of `selectedVariantId` op `song`).
   - 4.3 Lijst toont grid met covers, titel en status (generating/ready/failed).
   - 4.4 Detail/quick actions: Play (mini‑player), Open in Studio, Selecteer variant, Download (.mp3).

5) Delen
   - 5.1 Voor liedjes: genereer deelbare read‑only link (unieke token/slug). Zet een `isPublic` flag + `publicId` op `song` en expose beperkte velden.
   - 5.2 Deelbare view bevat player + titel/cover, maar géén privé metadata of volledige conversatie.

6) Zoeken/Sorteren/Filteren (Library)
   - 6.1 Zoeken op titel (gesprekstitel/nummer‑titel) en lyrics‑snippet (indien beschikbaar).
   - 6.2 Sorteren: “Laatst bijgewerkt” (default), “A‑Z”, “Recent afgespeeld”.
   - 6.3 Filteren: Status (generating/ready/failed), Taal, Template/Tags (indien gezet).

7) Verwijderen
   - 7.1 Hard‑delete: gebruiker kan gesprekken en liedjes verwijderen; records worden permanent verwijderd (inclusief varianten).

8) PWA en media
   - 8.1 Streamen/afspelen binnen mini‑player.
   - 8.2 Offline caching (best‑effort): recent afgespeelde audio‑URL(s) en coverafbeeldingen cachen via service worker; time‑to‑live configurabel.

9) Beveiliging & Toegang
   - 9.1 Middleware: APP_ENFORCE_SESSION=true voor `/library` en API’s (`/api/library/**`, mobile routes die Library bijwerken).
   - 9.2 InstantDB policies: alle queries gefilterd op `user.id == session.userId`.

10) Analytics
   - 10.1 Metric: % van gebruikers die na generatie terugkeren naar Library.
   - 10.2 Events: open‑from‑library, play‑from‑library, delete‑from‑library, share‑song.

## 5. Niet‑Doelen (Out of Scope)
- Geen weergave van volledige chatlog in Library (alleen samenvatting/versiegeschiedenis).
- Geen geavanceerde collectie/playlist‑features (kan later).
- Geen multi‑user collaboratie op Library items.

## 6. Design Overwegingen
- Library opzet: twee tabs (Gesprekken/Liedjes) met consistente kaart/grid UI.
- Liedje‑kaart: cover, titel, statusbadge, quick actions (play/open/share). Gesprek‑kaart: titel/snippet/ready% en “Open in Studio”.
- Responsive: grid breekt door naar 1 kolom op mobiel; mini‑player vast in de footer/bar indien actief.

## 7. Technische Overwegingen
InstantDB data (indicatief; match met `src/instant.schema.ts`):
- `conversations` (bestaand):
  - `user` (link), `createdAt`, `updatedAt`
  - `extractedContext` (JSON string/obj), `readinessScore` (number)
  - `conceptLyrics` (laatste snapshot) + optioneel `conceptHistory` (array)
  - `status` ('gathering'|'generating'|'refining'|'complete')
- `songs` (bestaand):
  - `user` (link), `conversation` (link), `title`, `lyrics`, `musicStyle`
  - `status` ('generating'|'ready'|'failed'), `generationParams` (JSON)
  - `selectedVariantId` (string|null)
  - Delen: `isPublic` (bool), `publicId` (string) voor sharebare links
  - (Toekomst) `callbackData` raw payload auditing (zie “Toekomst / TODO”)
- `sunoVariants` (bestaand):
  - `song` (link), `trackId` (pk), `title`, `imageUrl`, `streamAudioUrl`, `audioUrl`, `durationSeconds`, `modelName`, `tags`, `order`
  - `streamAvailableAt`, `downloadAvailableAt`

API/Server:
- SSR of client query: Library kan client‑side InstantDB queries gebruiken met policies per user; voor mobile PWA desnoods `/api/library/*` routes die pagineren en filteren.
- Delen: `/api/library/share/[publicId]` readonly endpoint met beperkte velden.
- Verwijderen: `DELETE /api/library/conversations/[id]`, `DELETE /api/library/songs/[id]` (en cascade op varianten).

Schema & Indexering (conform instant-rules.md):
- Velden waarop we filteren of ordenen MOETEN geindexeerd zijn.
- Voor Library weergave en zoek/sort/filter stellen we voor te indexeren:
  - conversations: `updatedAt` (order), `status` (filter), afgeleide `title`/`conceptTitle` (zoek), `user.id` (filter via link is toegestaan)
  - songs: `updatedAt` (order), `status` (filter), `title` (zoek), `isPublic` (filter), `publicId` (lookup), eventueel `lastPlayedAt` voor sort “Recent afgespeeld”
  - songs (zoek in lyrics): i.p.v. volledige `lyrics` indexeren, een veld `lyricsSnippet` (string, indexed) opslaan voor $ilike‑zoekopdrachten
  - sunoVariants: `song.id` (filter), `order` (weergeven), geen ordening op nested velden

Query‑patronen & beperkingen:
- Paginatie uitsluitend op top‑level (`songs`, `conversations`), niet op nested `variants` (beperking InstantDB).
- Filteren: gebruik `$ilike` voor titel/snippet; `$in/$and/$or` voor tags/status;
  geen `$exists/$regex` (niet ondersteund).
- Ordening: alleen op geindexeerde, niet‑geneste velden (bijv. `updatedAt`).

Client vs Admin SDK:
- Client: `@instantdb/react` met `db.useQuery` / `db.transact` voor user‑scoped reads/writes.
- Server: `@instantdb/admin` ALLEEN in serverroutes (callbacks, deletes, share‑reads) met admin token uit env; nooit op client.

PWA Caching:
- Service worker: cache recent audio streams (range requests pass‑through), covers, en Library lijst (stale‑while‑revalidate).

## 8. Succesmetrics
- S1: % van gebruikers die binnen 7 dagen na hun eerste generatie een item op `/library` openen.
- S2: Gemiddeld aantal library‑items per gebruiker (conversaties + songs).
- S3: Aantal plays gestart vanaf Library vs. Studio.

## 9. Edge‑Cases (uitleg + keuze)
- (A) Callback komt binnen maar DB‑write faalt
  - Uitleg: De provider meldt “klaar”, maar het opslaan in onze DB mislukte (netwerk/timeout). Oplossing: retry mechanismen en fallback in polling: als status endpoint faalt, check DB (en andersom). Visueel: status blijft op “genereren” met subtiele herprobeerlogica.
- (B) Polling geeft 404, maar callback heeft wél DB gevuld
  - Uitleg: Sommige providers geven 404 op status‑endpoints, maar we hebben al data via callback. Oplossing: front‑end pollt eigen API die ook DB‑fallback doet; zodra data aanwezig, UI wisselt naar “ready”.
- (C) Audio‑URL verlopen
  - Uitleg: Tijdelijke CDN/stream links kunnen verlopen. Oplossing: detecteer 401/403/404 bij afspelen en probeer herhydratie (nieuwe link) of toon “link verlopen – vernieuwen” actie.

Gekozen focus: (C) als expliciet scenario; (A) en (B) al technisch afgedekt in huidige implementatie (polling + callback‑fallback).

## 10. Nice‑to‑haves
- (D) Share to social (copy link)
- (C) Export: lyrics als `.txt` en song als `.mp3`
  
(Opmerking: Indien gewenst, ook (A) Favorieten/Starred later toevoegen.)

## 11. Acceptatiecriteria
- Gesprekken
  - (AC‑C1) Detailweergave toont concept‑lyrics versies en extracted context; “Open in Studio” laadt de sessie.
- Liedjes
  - (AC‑S1) Alle varianten zichtbaar; gebruiker kan kiezen en afspelen (mini‑player).
- Library
  - (AC‑L1) Zoeken/sorteren/filteren werken vloeiend tot 100+ items; geen merkbare UI‑stalls.

## 12. Deliverables
- `/library` pagina met tabs “Gesprekken” en “Liedjes”.
- Server policies en routes (indien nodig) met sessie‑handhaving.
- InstantDB transacties voor opslaan geselecteerde variant en delete flows.
- Shareable link flow voor songs (read‑only weergave).
- Basis offline caching in service worker voor audio & covers.

## 13. Toekomst / TODO
- (D) Ruwe callback‑payload opslaan bij songs voor audit/troubleshooting (nu nog niet opnemen). 
  - Action: voeg notitie toe in “caudelmd”/”caudel.md” (bevestig bestandsnaam/locatie), of beheer als issue in `/tasks`.
