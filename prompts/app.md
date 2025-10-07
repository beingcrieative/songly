Doel van het concept:Dit platform stelt gebruikers in staat om op een eenvoudige manier gepersonaliseerde liefdesliedjes te genereren. Het combineert een AI-agent voor het samenstellen van oprechte, persoonlijke lyrics, en een integratie met de Suno AI API voor het genereren van muziek. Gebruikers kunnen zo hun gevoelens en boodschappen vertalen in een muzikaal geschenk.
	2.	Belangrijkste functionaliteiten:
	•	Een chatgestuurde AI-agent die de gebruiker door een reeks vragen leidt:Bijvoorbeeld: “Wat is een bijzondere herinnering met je partner?”, “Welke eigenschap bewonder je het meest?”, “Welk gevoel wil je overbrengen?”.
	•	Dynamische lyric-generatie:De AI-agent zet de antwoorden om in unieke songteksten, afgestemd op de emotie en stijl.
	•	Muziekcompositie via Suno AI API:Op basis van de lyrics en gekozen sfeer genereert het platform passende muziek.
	•	Export en delen:Het eindresultaat is een compleet liedje dat gebruikers kunnen delen met hun geliefde, als dagelijkse muzikale boodschap.
	3.	Technische architectuur:
	
	•	Backend: Integratie met Claude SDK voor de AI-agent die de lyrics genereert. Suno AI API voor de muziekgeneratie.
	•	Data-opslag: Beveiligde opslag van gebruikerssessies (zonder persoonlijke gegevens).
	•	Uitvoer: Audiofile (MP3), eventueel met visuele componenten (bijvoorbeeld een albumcover).
	4.	Gebruikersflow:
	•	Gebruiker opent de app, kiest de optie ‘Liefdesliedje maken’.
	•	De AI-agent stelt gerichte vragen en vangt de kern van de boodschap.
	•	Lyrics en sfeer worden vastgesteld.
	•	Muziek wordt gegenereerd via Suno AI en gecombineerd met lyrics.
	•	Gebruiker kan het lied beluisteren, opslaan en delen.
	5.	Prompt voor de AI-coder:“Bouw een iOS-app met een chatinterface waar de gebruiker vragen beantwoordt. Gebruik de Claude SDK om op basis van die antwoorden songteksten te genereren. Integreer de Suno AI API voor de muziek. Zorg voor een vlotte gebruikersflow: vragen – lyrics genereren – muziek genereren – output delen. Houd rekening met modulariteit, zodat andere niches eenvoudig toegevoegd kunnen worden.”