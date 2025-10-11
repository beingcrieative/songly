# PRD: Twee‑Variant Lyrics Vergelijking, Keuze en Doorstroom naar Muziek (Desktop + Mobile)

## 1. Overzicht
We verplaatsen de kern van de studio naar lyrics. Zodra Suno lyrics terugstuurt, tonen we twee varianten centraal in beeld (desktop en mobile). De gebruiker vergelijkt, kiest één versie, kan eventueel éénmalig feedback geven voor verfijning of de tekst handmatig aanpassen, en pas daarna worden parameters (vocal/vocalgender etc.) bevestigd en de muziek gegenereerd. Het linkerpaneel (template/advanced) verdwijnt uit de standaardlay‑out; parameterinstellingen komen als compacte sheet/overlay op het moment van muziek genereren.

Doel: sneller beslissen met focus op tekst, minder afleiding, duidelijke keuze‑ en verfijnflow, en gecontroleerde kosten (max. één refine‑ronde).

## 2. Doelen
- G1. Toon altijd twee lyric-varianten (indien beschikbaar) centraal voor directe vergelijking.
- G2. Verplicht een keuze vóór muziek generatie; music‑button blijft disabled tot keuze is gemaakt.
- G3. Bied éénmalige feedback‑refine (kostencontrole) en handmatige bewerking van de gekozen lyrics.
- G4. Laat de gebruiker vóór muziek generatie vocale parameters (o.a. taal, vocal/vocalgender) bevestigen.
- G5. UI responsief: desktop twee kolommen; mobile gestapelde kaarten met swipe.
- G6. Analytics op vertoon, keuze, en (her)generatie/refine van lyrics.
- G7. Betrouwbare ontvangst van lyrics via callback; polling is secundair, UI blijft niet hangen.

## 3. User Stories
- US1. Als gebruiker wil ik twee lyric‑opties naast elkaar zien zodat ik snel kan kiezen.
- US2. Als gebruiker wil ik mijn gekozen lyrics kunnen verfijnen met één feedback‑ronde zodat ze beter passen.
- US3. Als gebruiker wil ik de gekozen lyrics handmatig kunnen bijwerken zodat ik kleine aanpassingen kan doen zonder extra AI‑kosten.
- US4. Als gebruiker wil ik voor muziek generatie de stemparameters kunnen instellen (o.a. vocal gender/taal) zodat de output past bij mijn voorkeur.
- US5. Als mobiele gebruiker wil ik kunnen swipen tussen A/B zodat vergelijken comfortabel werkt op kleine schermen.
- US6. Als product owner wil ik keuze‑ en refine‑events meten zodat we conversie en kosten kunnen optimaliseren.

## 4. Functionele Requirements
1. Vergelijkweergave (desktop):
   - 1.1 Toon exact twee variant‑kaarten (A en B) in twee kolommen, elk met scrollbaar lyric‑paneel.
   - 1.2 Radio/select per kaart; “Gebruik geselecteerde lyrics” knop enabled pas na selectie.
2. Vergelijkweergave (mobile):
   - 2.1 Kaarten onder elkaar, volledige breedte.
   - 2.2 Swipe‑gesture (links/rechts) om focus te wisselen tussen A/B; radiokeuze blijft beschikbaar.
   - 2.3 Sticky call‑to‑action (“Gebruik geselecteerde lyrics”) onderaan.
3. Keuze en gating:
   - 3.1 “Genereer Muziek” blijft disabled tot gebruiker één versie geselecteerd heeft (of handmatig bevestigt na edit).
   - 3.2 Na selectie verdwijnt de compare‑weergave; de gekozen lyrics worden “actieve” lyrics voor het project.
4. Eénmalige feedback‑refine:
   - 4.1 Bied eenmaal “Verfijn op basis van feedback” (tekstveld + verzenden). Daarna is refine disabled (label: “Refine gebruikt”).
   - 4.2 Toon voortgang (“Lyrics worden verfijnd…”) en verwerk callback. Vervang de actieve lyrics door de verfijnde versie.
5. Handmatige bewerking:
   - 5.1 Bied een “Bewerk lyrics” actie (modale editor). Bij opslaan worden deze lyrics de actieve versie.
   - 5.2 Audit: markeer manuele edits (flag) en bewaar timestamp.
6. Muziekgeneratie‑parameters:
   - 6.1 Linkerpaneel verdwijnt uit de standaardlay‑out (A3).
   - 6.2 Voor “Genereer Muziek” verschijnt een compacte parametersheet (modal/side‑sheet) met: taal, vocalGender (m/v/neutral), optioneel vocalAge, en overige reeds bestaande velden die relevant zijn.
   - 6.3 Deze instellingen worden samengevoegd met template/advanced defaults en naar Suno gestuurd.
7. Opslag en versiebeheer (InstantDB):
   - 7.1 Sla alleen de geselecteerde lyrics als nieuwe lyric_versions op (D2).
   - 7.2 Bewaar variant‑meta (index/bron) in het versierecord.
   - 7.3 Log analytics (D3): selectie‑event (index, tijd), refine‑event, regenerate‑event.
8. Callback‑primair, polling‑secundair:
   - 8.1 Lyrics worden ophaald via callback; bij ontvangst toon opties (A/B) of een enkele variant.
   - 8.2 Polling blijft fallback; UI hangt niet door 404’s. Bij timeout: foutmelding met opties (Retry / Terug naar chat).
9. Compact chat:
   - 9.1 Verklein verticale spacing in chatlijst en input (F1).
   - 9.2 Na het tonen van A/B kan chat worden ingeklapt (toggle) om focus op lyrics te houden.
10. Feature flag en rollout:
    - 10.1 Activeer via NEXT_PUBLIC_ENABLE_LYRICS_COMPARE (J1). Bij uit schakelen: huidige lay‑out blijft actief.

## 5. Non‑Goals (Out of Scope)
- NG1. Volledige herontwerp van de chatervaring (L1) – alleen compact spacing en inklappen.
- NG2. Karaoke/timestamp features; worden separaat opgepakt.
- NG3. Wijzigingen aan muziekvariant‑vergelijkflow (ongewijzigd hergebruiken zodra muziek is gegenereerd).

## 6. Design Considerations
- Layout
  - Desktop: 2 kolommen A/B, centrale focus, breedte max-w-5xl.
  - Mobile: gestapeld, swipe‑gesture voor focuswissel, sticky CTA.
- Kaarten tonen label (Versie A/B), selectable state, en acties (Refine/Copy/Edit).
- Parameter‑sheet: compacte controls (taal, vocalGender, optioneel vocalAge). Sluit aan bij bestaande visuele taal.
- Linkerpaneel verwijderen: Template/advanced controls verhuizen naar de parametersheet vóór muziek generatie.

## 7. Technical Considerations
- Data + opslag (InstantDB):
  - Alleen geselecteerde lyrics persist (D2). Bewaar bronvariant (A/B) en flags (refined/manual_edit).
  - Existing conversations.lyric_versions wordt gebruikt.
- Suno integratie:
  - Callback heeft prioriteit; bij ontvangst lyric_variants in cache opslaan en de compare‑UI tonen.
  - Polling is fallback; geef bij timeouts een nette fout met Retry / Terug naar chat (G3).
- Responsiveness:
  - CSS grid/flex, kaart‑max‑height met in‑card scroll; sticky CTA op mobile.
  - Swipe: eenvoudige gesture‑detectie (Touch events) of lightweight helper.
- Feature flag:
  - NEXT_PUBLIC_ENABLE_LYRICS_COMPARE om de compare‑ervaring conditioneel te tonen.
- Analytics:
  - Events: LYRICS_OPTIONS_SHOWN (H1), LYRICS_OPTION_SELECTED (H2), LYRICS_REGENERATED / LYRICS_REFINED (H3).

## 8. Success Metrics
- SM1. ≥80% van de gebruikers selecteert binnen 2 minuten een lyric‑versie.
- SM2. <5% timeouts bij lyrics (callback of fallback laat UI door).
- SM3. ≥60% van de gekozen lyrics leidt tot muziek generatie (conversion).
- SM4. ≤1 refine per sessie, zoals technisch afgedwongen.

## 9. Open Questions
- OQ1. Welke extra parameters (naast taal/vocalGender) wil je minimaal in de compacte sheet? (vocalAge? styleWeight/weirdness?)
- OQ2. Wil je Copy/Download als actie op de kaarten, of is Copy voldoende?
- OQ3. Mag “Regenerate options” een extra kostenactie zijn, en wil je een limiet?
- OQ4. Moeten we de ongekozen variant tijdelijk bewaren (alleen in cache) voor undo, of is dat niet nodig?

