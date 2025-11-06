/**
 * Suno Lyrics Prompt Builder
 *
 * Generates compact prompts for Suno's lyrics-only endpoint.
 * Suno enforces ~200 characters max, so we prioritise key details
 * and gracefully truncate while keeping the message readable.
 */

import { ExtractedContext } from "@/types/conversation";
import { MusicTemplate } from "@/templates/music-templates";

// Suno API has a strict 200 character limit for lyrics generation prompts
const MAX_PROMPT_CHARS = Number(process.env.SUNO_LYRICS_PROMPT_CHAR_LIMIT || "200");
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
        memories[0] ? `Herinnering: ${shorten(memories[0], 40)}.` : null,
        memories[1] ? `Ook: ${shorten(memories[1], 30)}.` : null,
        emotions[0] ? `Emotie: ${shorten(emotions[0], 30)}.` : null,
        emotions[1] ? `Ook: ${shorten(emotions[1], 25)}.` : null,
        partnerTraits[0] ? `Partner: ${shorten(partnerTraits[0], 30)}.` : null,
        specialMoments[0] ? `Moment: ${shorten(specialMoments[0], 30)}.` : null,
        "Mix genres en tempo's.",
        "Behoud emotionele kern.",
        "Gebruik vivide beelden."
      ],
      SURPRISE_FILLER
    );
  }

  return composePrompt(
    [
      `Schrijf een ${template.name.toLowerCase()} liefdeslied in ${language}.`,
      memories[0] ? `Herinnering: ${shorten(memories[0], 40)}.` : null,
      memories[1] ? `Ook: ${shorten(memories[1], 35)}.` : null,
      memories[2] ? `Nog: ${shorten(memories[2], 30)}.` : null,
      emotions[0] ? `Emotie: ${shorten(emotions[0], 30)}.` : null,
      emotions[1] ? `Ook: ${shorten(emotions[1], 25)}.` : null,
      partnerTraits[0] ? `Partner: ${shorten(partnerTraits[0], 30)}.` : null,
      partnerTraits[1] ? `Ook: ${shorten(partnerTraits[1], 25)}.` : null,
      specialMoments[0] ? `Moment: ${shorten(specialMoments[0], 30)}.` : null,
      relationshipLength ? `Relatie: ${relationshipLength}.` : null,
      template.sunoConfig.style
        ? `Stijl: ${shorten(template.sunoConfig.style, 30)}.`
        : null,
      template.sunoConfig.tags
        ? `Genre: ${shorten(template.sunoConfig.tags, 25)}.`
        : null,
      musicStyle ? `Muziek: ${shorten(musicStyle, 30)}.` : null,
      vocalDescription ? `Vocals: ${shorten(vocalDescription, 25)}.` : null,
      "Gebruik coupletten en refreinen.",
      "Voeg zintuiglijke details toe.",
      "Eindig warm en hoopvol."
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
  const snippet = shorten(previousLyrics, template.id === "surprise-me" ? 30 : 35);

  const sentences: Array<string | null> = [
    `Pas lyrics aan: ${shorten(feedback, 40)}.`,
    template.id === "surprise-me"
      ? "Behoud verrassende structuur en vloeiendheid."
      : "Behoud stijl, emotie en balans.",
    `Kern: ${snippet}.`,
    "Lever herschreven versie."
  ];

  const fillers = template.id === "surprise-me" ? SURPRISE_FILLER : REFINEMENT_FILLER;
  return composePrompt(sentences, fillers);
}
