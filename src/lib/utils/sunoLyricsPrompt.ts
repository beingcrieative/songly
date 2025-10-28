/**
 * Suno Lyrics Prompt Builder
 *
 * Generates compact prompts for Suno's lyrics-only endpoint.
 * Suno enforces ~200 characters max, so we prioritise key details
 * and gracefully truncate while keeping the message readable.
 */

import { ExtractedContext } from "@/types/conversation";
import { MusicTemplate } from "@/templates/music-templates";

// Suno API accepts ~200 words max, which is approximately 1200 characters
// (average word length 5 chars + 1 space = 6 chars per word)
const MAX_PROMPT_CHARS = Number(process.env.SUNO_LYRICS_PROMPT_CHAR_LIMIT || "1200");
const MIN_PROMPT_CHARS = Number(process.env.SUNO_LYRICS_PROMPT_MIN_CHARS || "60");

const STANDARD_FILLER = [
  "Beschrijf intieme details en zorg voor couplet-refrein structuur.",
  "Gebruik rijm en ritme zodat de tekst muzikaal aanvoelt.",
  "Eindig met een warme, hoopvolle boodschap."
];

const SURPRISE_FILLER = [
  "Mix onverwachte genres en tempo’s voor een speelse sfeer.",
  "Gebruik surrealistische beelden en sterke emoties.",
  "Laat het einde open en prikkelend."
];

const REFINEMENT_FILLER = [
  "Behoud emotie maar verbeter ritme en rijm.",
  "Voeg levendige details toe aan nieuwe passages.",
  "Zorg dat de herziene versie vloeiend en persoonlijk blijft."
];

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function shorten(text: string, limit: number): string {
  const value = clean(text);
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(limit - 1, 1)).trimEnd()}…`;
}

function composePrompt(sentences: Array<string | null>, fillers: string[]): string {
  const usable = sentences
    .map((s) => (s ? clean(s) : ""))
    .filter(Boolean);

  let result = "";
  for (const sentence of usable) {
    const candidate = result ? `${result} ${sentence}` : sentence;
    if (candidate.length <= MAX_PROMPT_CHARS) {
      result = candidate;
    } else {
      const remaining = MAX_PROMPT_CHARS - result.length;
      if (remaining > 4) {
        result = `${result} ${shorten(sentence, remaining)}`.trim();
      }
      break;
    }
  }

  if (!result) {
    result = shorten(fillers[0] || "Schrijf een persoonlijk liefdeslied.", MAX_PROMPT_CHARS);
  }

  if (result.length < MIN_PROMPT_CHARS) {
    for (const filler of fillers) {
      const cleaned = clean(filler);
      if (!cleaned) continue;
      const candidate = result ? `${result} ${cleaned}` : cleaned;
      if (candidate.length >= MIN_PROMPT_CHARS && candidate.length <= MAX_PROMPT_CHARS) {
        result = candidate;
        break;
      }
      if (candidate.length < MIN_PROMPT_CHARS) {
        result = candidate;
        continue;
      }
      const remaining = MAX_PROMPT_CHARS - result.length;
      if (remaining > 4) {
        result = `${result} ${shorten(cleaned, remaining)}`.trim();
      }
      break;
    }
  }

  return shorten(result, MAX_PROMPT_CHARS);
}

export function buildSunoLyricsPrompt(
  context: ExtractedContext,
  template: MusicTemplate,
  language: string = "Nederlands"
): string {
  const {
    memories = [],
    emotions = [],
    partnerTraits = [],
    specialMoments = [],
    relationshipLength,
    musicStyle,
    vocalDescription
  } = context;

  if (template.id === "surprise-me") {
    return composePrompt(
      [
        `Schrijf een verrassend liefdeslied in ${language}.`,
        memories[0] ? `Belangrijkste herinnering: ${shorten(memories[0], 120)}.` : null,
        memories[1] ? `Ook belangrijk: ${shorten(memories[1], 100)}.` : null,
        emotions[0] ? `Primaire emotie: ${shorten(emotions[0], 80)}.` : null,
        emotions[1] ? `Secundaire emotie: ${shorten(emotions[1], 70)}.` : null,
        partnerTraits[0] ? `Partner eigenschap: ${shorten(partnerTraits[0], 80)}.` : null,
        specialMoments[0] ? `Bijzonder moment: ${shorten(specialMoments[0], 80)}.` : null,
        "Mix genres, tempo's en onverwachte structuren.",
        "Behoud een emotionele kern ondanks de experimenten.",
        "Gebruik vivide beelden en zintuiglijke details."
      ],
      SURPRISE_FILLER
    );
  }

  return composePrompt(
    [
      `Schrijf een ${template.name.toLowerCase()} liefdeslied in ${language}.`,
      memories[0] ? `Belangrijkste herinnering: ${shorten(memories[0], 150)}.` : null,
      memories[1] ? `Tweede herinnering: ${shorten(memories[1], 120)}.` : null,
      memories[2] ? `Ook relevant: ${shorten(memories[2], 100)}.` : null,
      emotions[0] ? `Dominante emotie: ${shorten(emotions[0], 80)}.` : null,
      emotions[1] ? `Ook voelbaar: ${shorten(emotions[1], 70)}.` : null,
      partnerTraits[0] ? `Partner eigenschap: ${shorten(partnerTraits[0], 100)}.` : null,
      partnerTraits[1] ? `Nog een eigenschap: ${shorten(partnerTraits[1], 80)}.` : null,
      specialMoments[0] ? `Bijzonder moment: ${shorten(specialMoments[0], 90)}.` : null,
      relationshipLength ? `Relatie duur: ${relationshipLength}.` : null,
      template.sunoConfig.style
        ? `Muziekstijl: ${shorten(template.sunoConfig.style, 80)}.`
        : null,
      template.sunoConfig.tags
        ? `Genre tags: ${shorten(template.sunoConfig.tags, 60)}.`
        : null,
      musicStyle ? `Gewenste muziekstijl: ${shorten(musicStyle, 80)}.` : null,
      vocalDescription ? `Vocale stijl: ${shorten(vocalDescription, 70)}.` : null,
      "Gebruik coupletten, refreinen en een brug.",
      "Voeg zintuiglijke details en concrete beelden toe.",
      "Eindig met een warme, hoopvolle boodschap."
    ],
    STANDARD_FILLER
  );
}

export function buildLyricsRefinementPrompt(
  previousLyrics: string,
  feedback: string,
  _context: ExtractedContext,
  template: MusicTemplate
): string {
  const snippet = shorten(previousLyrics, template.id === "surprise-me" ? 60 : 80);

  const sentences: Array<string | null> = [
    `Pas de lyrics aan op basis van feedback: ${shorten(feedback, 60)}.`,
    template.id === "surprise-me"
      ? "Behoud de verrassende structuur maar laat de tekst vloeiend blijven."
      : "Behoud de gekozen stijl, emotie en couplet-refrein balans.",
    `Huidige kern: ${snippet}.`,
    "Lever een volledige, herschreven versie terug."
  ];

  const fillers = template.id === "surprise-me" ? SURPRISE_FILLER : REFINEMENT_FILLER;
  return composePrompt(sentences, fillers);
}
