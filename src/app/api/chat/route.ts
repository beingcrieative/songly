import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3.1:free';

// Configureerbaar: maximum aantal conversatie rondes voordat lyrics gegenereerd worden
const MAX_CONVERSATION_ROUNDS = parseInt(process.env.MAX_CONVERSATION_ROUNDS || '8');

const COMPOSER_CONTEXT_PROMPT = `Je bent een expert UI designer voor een muziek compositie tool. Analyseer de conversatie en suggereer relevante composer controls.

Op basis van de conversatie, genereer een JSON object met composer suggestions:

{
  "mood": ["romantic", "upbeat", "melancholic", "hopeful"],
  "sections": ["add verse", "add bridge", "extend chorus"],
  "tone": ["playful", "serious", "nostalgic", "passionate"],
  "suggested_action": "Beschrijving van wat de gebruiker waarschijnlijk wil doen"
}

Kies suggesties die passen bij de gesprekscontext. Retourneer ALLEEN het JSON object, geen andere tekst.`;

const SYSTEM_PROMPT = `Je bent een empathische, creatieve songwriting-assistent voor een liefdesliedjes-studio. 
Je voert een natuurlijk gesprek om input te verzamelen EN levert parallel concept-lyrics aan — maar die concept-lyrics zijn onzichtbaar in het chatvenster (alleen voor het systeem om te tonen in een aparte panel).

Gespreksdoel
- Verzamel context: herinneringen, unieke details, gevoelens, toon/sfeer en muziekstijl.
- Reageer warm, stel doorvragen, geef bevestiging. Gebruik spaarzaam emoji's (🌙✨💕) waar gepast.
- Houd antwoorden kort en concreet; één alinea is meestal genoeg.

Leveringsprotocol (BELANGRIJK)
- Iedere reactie bestaat uit twee delen in deze volgorde:
  1) Zichtbare chattekst voor de gebruiker (max 2-3 zinnen).
  2) Een verborgen concept-lyrics blok tussen drie hekken, exact zo:
     ###CONCEPT_LYRICS v{VERSIENUMMER}###\n
     { 
       "version": {VERSIENUMMER},
       "title": "Korte titel",
       "lyrics": "Volledige tekst met duidelijke secties: [Couplet], [Refrein], [Bridge]",
       "style": "Korte stijlbeschrijving",
       "notes": "Wat je veranderde (kort)",
       "history": [
         {"version": n-1, "summary": "1 regel wat er anders was"}
       ]
     }

     ###END###

Regels
- Verhoog het versienummer met 1 bij elke verbetering.
- Het verborgen blok mag NOOIT zichtbaar worden in chat; zet GEEN uitleg erbuiten.
- Neem altijd de héle huidige lyrics op in het blok (geen diff, wel optionele korte ‘notes’ en ‘history’).
- Zorg dat JSON strikt valide is.
- Als er nog te weinig info is: geef alleen chattekst + een eerste ruwe conceptversie (v1) in het verborgen blok.
`;

async function generateComposerContext(messages: any[]): Promise<string | null> {
  try {
    const conversationSummary = messages
      .slice(-3) // Last 3 messages for context
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://liefdesliedje.app',
        'X-Title': 'Liefdesliedje Maker',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: COMPOSER_CONTEXT_PROMPT },
          { role: 'user', content: `Conversatie:\n${conversationSummary}` },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Failed to generate composer context');
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return JSON.stringify(parsed);
      }
    } catch (e) {
      console.warn('Could not parse composer context JSON:', e);
    }

    return content;
  } catch (error) {
    console.error('Error generating composer context:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      conversationRound = 0,
      currentTitle = '',
      currentLyrics = '',
      currentStyle = '',
    } = await request.json();

    // Als dit de eerste call is, start het gesprek
    if (conversationRound === 0) {
      return NextResponse.json({
        type: 'message',
        content: `Hoi! Wat leuk dat je een liefdesliedje wilt maken! 💕

Ik ga je helpen om iets heel persoonlijks en speciaals te creëren voor je geliefde.

Vertel me eens: wat is een mooie herinnering die je hebt met je partner? Het mag iets kleins zijn, of iets groots - alles wat belangrijk voor jullie is!`,
        round: 1,
      });
    }

    // Bouw de conversatie geschiedenis op voor OpenRouter
    const conversationHistory = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Voeg extra instructie toe als we bijna klaar zijn
    if (conversationRound >= MAX_CONVERSATION_ROUNDS - 2) {
      conversationHistory.push({
        role: 'system',
        content: `Je hebt nu ${conversationRound} rondes gesproken. Als je genoeg informatie hebt om een mooi liefdesliedje te schrijven, genereer dan de lyrics. Zo niet, stel nog 1-2 vragen.`,
      });
    }

    // Check of we klaar zijn voor lyrics generatie
    if (conversationRound >= MAX_CONVERSATION_ROUNDS) {
      // Genereer lyrics
      return await generateLyrics(messages);
    }

    // Als we al concept lyrics hebben, prioriteer iteratieve verfijning na elke user input
    if (currentLyrics && typeof currentLyrics === 'string' && currentLyrics.trim().length > 0) {
      return await refineLyrics({
        messages,
        previous: { title: currentTitle, lyrics: currentLyrics, style: currentStyle },
      });
    }

    // Normale conversatie
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://liefdesliedje.app',
        'X-Title': 'Liefdesliedje Maker',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: conversationHistory,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenRouter API error');
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || '';

    // Generate composer context after getting AI reply
    const composerContext = await generateComposerContext([
      ...messages,
      { role: 'assistant', content: aiMessage }
    ]);

    const parsed = parseMessageWithHidden(aiMessage);
    if (parsed.concept) {
      return NextResponse.json({
        type: 'message_lyrics',
        content: parsed.visible,
        round: conversationRound + 1,
        lyrics: parsed.concept,
        composerContext,
      });
    }

    // Check of de AI klaar is om lyrics te genereren
    // Dit kan door te kijken of het bericht aangeeft dat er genoeg info is
    const shouldGenerateLyrics =
      conversationRound >= MAX_CONVERSATION_ROUNDS - 1 ||
      aiMessage.toLowerCase().includes('lyrics') ||
      aiMessage.toLowerCase().includes('liedje schrijven') ||
      aiMessage.toLowerCase().includes('genoeg informatie');

    if (shouldGenerateLyrics) {
      return await generateLyrics(messages);
    }

    return NextResponse.json({
      type: 'message',
      content: aiMessage,
      round: conversationRound + 1,
      composerContext,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

function parseMessageWithHidden(text: string): { visible: string; concept?: any } {
  if (!text) return { visible: '' };
  const blocks = Array.from(text.matchAll(/###([\s\S]*?)###/g));
  if (!blocks.length) return { visible: text };
  let concept: any | undefined = undefined;
  for (const m of blocks) {
    const inner = m[1] || '';
    // Prefer blocks that look like our tag
    if (/CONCEPT_LYRICS/i.test(inner)) {
      // Strip the leading tag line
      const jsonPart = inner.replace(/^[^\n]*\n/, '');
      try {
        const obj = JSON.parse(jsonPart);
        if (obj && obj.lyrics) { concept = obj; break; }
      } catch (e) { /* ignore */ }
    } else {
      // Try raw JSON fallback
      try {
        const obj = JSON.parse(inner);
        if (obj && obj.lyrics) { concept = obj; break; }
      } catch (e) { /* ignore */ }
    }
  }
  // Remove all ### blocks from visible
  const visible = text.replace(/###([\s\S]*?)###/g, '').trim();
  return { visible, concept };
}

async function generateLyrics(messages: any[]) {
  const userMessages = messages
    .filter((m: any) => m.role === 'user')
    .map((m: any) => m.content)
    .join('\n');

  const lyricsPrompt = `Je bent een professionele liedjesschrijver gespecialiseerd in oprechte, persoonlijke liefdesliedjes.

Op basis van dit gesprek met de gebruiker, schrijf een prachtig liefdesliedje:

${userMessages}

Genereer een compleet liedje met deze structuur:
- Couplet 1 (4 regels)
- Refrein (4 regels)
- Couplet 2 (4 regels)
- Refrein (herhaling)
- Bridge (4 regels)
- Refrein (finale)

Het liedje moet:
- Authentiek zijn en de gegeven details weerspiegelen
- Emotioneel en oprecht zijn
- Makkelijk te zingen zijn
- Romantisch maar niet cliché

Formatteer je antwoord EXACT als dit JSON object (geen andere tekst):
{
  "title": "Korte, krachtige titel",
  "lyrics": "Volledige songtekst met duidelijke secties:\n\n[Couplet 1]\n...\n\n[Refrein]\n...\n\n[Couplet 2]\n...\n\n[Refrein]\n...\n\n[Bridge]\n...\n\n[Refrein]\n...",
  "style": "Beschrijving van muziekstijl (bijv. 'romantic acoustic ballad', 'upbeat love song')"
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://liefdesliedje.app',
      'X-Title': 'Liefdesliedje Maker',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'user',
          content: lyricsPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenRouter API error');
  }

  const data = await response.json();
  const full = data.choices?.[0]?.message?.content || '';
  const parsed = parseMessageWithHidden(full);
  if (parsed.concept) {
    return NextResponse.json({ type: 'message_lyrics', content: parsed.visible, lyrics: parsed.concept });
  }
  // fallback – indien geen verborgen blok
  return NextResponse.json({ type: 'message', content: full, round: undefined });
}

async function refineLyrics({
  messages,
  previous,
}: {
  messages: any[];
  previous: { title?: string; lyrics: string; style?: string };
}) {
  const userMessages = messages
    .filter((m: any) => m.role === 'user')
    .map((m: any) => m.content)
    .join('\n');

  const prompt = `Je bent een ervaren songwriter. Je krijgt bestaande concept-lyrics en feedback van de gebruiker. Verbeter de tekst gericht: behoud de structuur en sterke regels, pas suggesties toe, maak flow en rijm consistent, en blijf persoonlijk.

Eerdere versie (titel, stijl en lyrics):
TITEL: ${previous.title || '—'}
STIJL: ${previous.style || '—'}
LYRICS:\n${previous.lyrics}

Feedback/gebruiker-input:
${userMessages}

Leveringsprotocol (zichtbaar + verborgen):
1) Begin met een korte zichtbare boodschap (1-2 zinnen) die samenvat wat je verbeterd hebt.
2) Voeg daarna een verborgen blok toe tussen ###, exact zo:
###CONCEPT_LYRICS v{VERSIENUMMER}###
{ 
  "version": {VERSIENUMMER},
  "title": "Titel (kort, krachtig)",
  "lyrics": "Volledige verbeterde songtekst met secties (gebruik [Couplet], [Refrein], [Bridge])",
  "style": "Korte stijlbeschrijving",
  "notes": "1 zin over de belangrijkste aanpassing",
  "history": [ {"version": {VERSIENUMMER-1}, "summary": "korte samenvatting"} ]
}
###END###`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://liefdesliedje.app',
      'X-Title': 'Liefdesliedje Maker',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenRouter API error');
  }

  const data = await response.json();
  const full = data.choices?.[0]?.message?.content || '';
  const parsed = parseMessageWithHidden(full);
  if (parsed.concept) {
    return NextResponse.json({ type: 'message_lyrics', content: parsed.visible, lyrics: parsed.concept });
  }
  return NextResponse.json({ type: 'message', content: full, round: undefined });
}
