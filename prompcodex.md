### **Prompt voor AI Agent: Ontwerp en Bouw een Landingspagina voor "Liefdesliedje Maker"**

**1. Projectdoel & Visie**

Je taak is het creëren van een complete, visueel verbluffende en emotioneel resonerende landingspagina voor de SaaS-applicatie "Liefdesliedje Maker". De pagina moet bezoekers onmiddellijk boeien, de "magie" van het product overbrengen en hen aanzetten tot actie. De algehele sfeer moet premium, warm en persoonlijk zijn, niet goedkoop of generiek.

**2. Kernidentiteit & Branding**

*   **Gevoel:** Magisch, persoonlijk, creatief, modern, oprecht en een tikje luxueus.
*   **Associaties:** Het gevoel van een handgeschreven brief, een onvergetelijk cadeau, een intiem moment.
*   **Vermijden:** Felle, schreeuwerige kleuren, generieke stockfoto's van lachende koppels, een "techy" of koude uitstraling.

**3. Doelgroep**

*   **Primaire groep:** "De Romantische Cadeaugever". Leeftijd 25-45, in een serieuze relatie. Ze zoeken een uniek en betekenisvol cadeau voor een speciale gelegenheid (jubileum, Valentijn, verjaardag). Ze waarderen sentiment en personalisatie boven een lage prijs.
*   **Gedrag:** Actief op visuele social media zoals Instagram en Pinterest. Laten zich inspireren door mooie en emotionele content.

**4. Kernboodschap & Waardepropositie**

*   **Headline (H1):** Zeg het met een lied.
*   **Sub-headline:** Creëer in 5 minuten een uniek liefdeslied voor de persoon van wie je houdt. Geen muzikale kennis nodig.
*   **Unieke Waarde:** We vertalen jouw persoonlijke herinneringen en gevoelens naar een compleet, radiowaardig lied. Het meest persoonlijke cadeau dat je ooit zult geven.

**5. Paginastructuur & Secties (van boven naar beneden)**

*   **Sectie 1: Hero Section (Boven de vouw)**
    *   **Achtergrond:** Een subtiele, abstracte en langzaam bewegende animatie (bv. zachte, gloeiende deeltjes of vloeiende lijnen die op geluidsgolven lijken).
    *   **Content:** De Headline (H1) en Sub-headline.
    *   **Primaire Call-to-Action (CTA):** Een prominente knop met de tekst: `Creëer je Liefdeslied (Gratis)`.
    *   **Visueel element:** Een minimalistische, geanimeerde muziekspeler die een fragment van een voorbeeldlied toont, om direct de kwaliteit te demonstreren.

*   **Sectie 2: Hoe het Werkt (Simpel & Visueel)**
    *   **Titel:** In drie simpele stappen naar een meesterwerk.
    *   **Layout:** Drie kolommen met iconen en korte tekst:
        1.  **Beantwoord de vragen:** Een chat-icoon. "Onze AI-assistent stelt je een paar persoonlijke vragen."
        2.  **AI creëert de magie:** Een brein/sterren-icoon. "We schrijven een unieke tekst en componeren de perfecte muziek."
        3.  **Deel je unieke lied:** Een cadeau/hart-icoon. "Verras je geliefde met een onvergetelijk en persoonlijk cadeau."

*   **Sectie 3: Social Proof & Demo**
    *   **Titel:** Voel de magie.
    *   **Content:** Een ingesloten, professioneel ogende videospeler (Vimeo of YouTube). De video is een 30-seconden screen-capture die het eindproduct toont: een prachtig albumhoes-artwork met het lied dat speelt en de songtekst die meescrolt. Dit is de belangrijkste sectie om de "wow"-factor te tonen.

*   **Sectie 4: Testimonials**
    *   **Titel:** Wat onze gebruikers zeggen.
    *   **Content:** Twee of drie korte, krachtige testimonials in "cards".
        *   *"Mijn partner was in tranen. Het meest persoonlijke cadeau dat ik ooit heb gegeven. Onbetaalbaar."* - Sarah K.
        *   *"Ik ben totaal niet muzikaal, maar hiermee voelde ik me een echte artiest. Het proces was zo eenvoudig en het resultaat is verbluffend."* - Mark V.

*   **Sectie 5: Finale Call-to-Action**
    *   **Titel:** Klaar om jouw verhaal te vertellen?
    *   **Content:** Een korte, overtuigende zin. "Begin nu en creëer een herinnering die voor altijd blijft."
    *   **Secundaire CTA:** Dezelfde knop als in de hero-sectie: `Creëer je Liefdeslied (Gratis)`.

**6. Visuele Stijl & Design Systeem**

*   **Kleurenpalet:**
    *   Achtergrond: Gebroken wit / zacht crème (`#FDFBF6`).
    *   Primaire accentkleur: Diep, warm bordeauxrood (`#8C2F39`).
    *   Secundaire accentkleur: Zachtroze / perzik (`#F2D7D5`).
    *   Tekstkleur: Donkergrijs / bijna zwart (`#333333`).
    *   CTA Knoppen: Een subtiel verloop van bordeauxrood naar een iets lichtere tint.
*   **Typografie:**
    *   Headlines (H1, H2): Een elegant, klassiek serif lettertype (bv. **Playfair Display** of **Lora**).
    *   Body & UI tekst: Een zeer leesbaar, modern sans-serif lettertype (bv. **Inter** of **Lato**).
*   **Iconografie:** Gebruik minimalistische, lijn-gebaseerde iconen die passen bij de elegante stijl.
*   **Animaties:** Gebruik `Framer Motion` voor subtiele en vloeiende animaties:
    *   Fade-in en lichte 'slide-up' effecten wanneer secties in beeld komen tijdens het scrollen.
    *   Zachte hover-effecten op knoppen en interactieve elementen.

**7. Technische Specificaties**

*   **Framework:** Next.js
*   **Styling:** Tailwind CSS
*   **Componenten:** Bouw de pagina op uit herbruikbare React-componenten (Hero, HowItWorks, TestimonialCard, etc.). Houd de componenten het liefst binnen dezelfde route-map zodat varianten makkelijk naast elkaar kunnen bestaan.
*   **Responsiviteit:** De pagina moet er perfect uitzien en functioneren op desktop, tablet en mobiel. Besteed extra aandacht aan de mobiele ervaring.
*   **Animaties:** Gebruik `Framer Motion` of subtiele CSS keyframes voor fade-ins en slide-ups. Kies de lichtste optie die past bij het bestaande design system—voorkom onnodige dependencies.
*   **Bestandslocatie:** Plaats de eerste variant van de landingpagina in `src/app/landingpage1/page.tsx`. Voeg eventuele volgende varianten toe als `src/app/landingpage2/page.tsx`, `src/app/landingpage3/page.tsx`, enzovoort, zodat elke versie direct via een eigen route bereikbaar is.
*   **Stijlconsistentie:** Sluit aan bij de al aanwezige fonts (`Inter` en `Playfair Display`) en de zachte crème-achtergrond uit `globals.css`, tenzij er een duidelijke reden is om hiervan af te wijken.

**Samenvatting:** Het eindresultaat moet een landingspagina zijn die aanvoelt als de digitale etalage van een luxe boetiek. Het verkoopt geen software, het verkoopt een onvergetelijke emotionele ervaring. Succes!
