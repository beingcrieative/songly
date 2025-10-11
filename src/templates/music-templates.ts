/**
 * Music Template System
 *
 * Defines template configurations for the Liefdesliedje Studio.
 * Each template provides a predefined style and Suno API parameters
 * to give users predictable and consistent music generation results.
 */

/**
 * Suno API configuration for a music template
 */
export interface SunoConfig {
  /** Style description for Suno (e.g., "slow romantic ballad with piano") */
  style: string;

  /** Genre/mood tags (e.g., "ballad, romantic, emotional, piano") */
  tags: string;

  /** Suno model version to use */
  model: 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';

  /** Style weight: how much to adhere to style (0.00-1.00) */
  styleWeight?: number;

  /** Weirdness constraint: creativity vs safety (0.00-1.00, lower = safer) */
  weirdnessConstraint?: number;

  /** Audio weight: audio vs lyrics focus (0.00-1.00) */
  audioWeight?: number;

  /** Elements or styles to avoid (comma-separated) */
  negativeTags?: string;
}

/**
 * Music template definition
 */
export interface MusicTemplate {
  /** Unique template identifier */
  id: string;

  /** Display name (e.g., "Romantische Ballad") */
  name: string;

  /** Template description for users */
  description: string;

  /** URL to preview audio file (30-second instrumental sample) */
  previewAudioUrl: string;

  /** URL to template cover image */
  imageUrl: string;

  /** Suno API configuration for this template */
  sunoConfig: SunoConfig;

  /** Optional: Custom icon or emoji */
  icon?: string;
}

/**
 * Template validation error
 */
export class TemplateValidationError extends Error {
  constructor(templateId: string, field: string, message: string) {
    super(`Template "${templateId}" validation failed: ${field} - ${message}`);
    this.name = 'TemplateValidationError';
  }
}

/**
 * Validates a music template configuration
 * @throws {TemplateValidationError} if validation fails
 */
export function validateTemplate(template: MusicTemplate): void {
  // Required fields
  if (!template.id) {
    throw new TemplateValidationError(template.id || 'unknown', 'id', 'ID is required');
  }
  if (!template.name) {
    throw new TemplateValidationError(template.id, 'name', 'Name is required');
  }
  if (!template.description) {
    throw new TemplateValidationError(template.id, 'description', 'Description is required');
  }
  if (!template.sunoConfig) {
    throw new TemplateValidationError(template.id, 'sunoConfig', 'Suno config is required');
  }

  // Suno config validation
  const { sunoConfig } = template;

  if (!sunoConfig.model || !['V4', 'V4_5', 'V4_5PLUS', 'V5'].includes(sunoConfig.model)) {
    throw new TemplateValidationError(
      template.id,
      'sunoConfig.model',
      `Invalid model: ${sunoConfig.model}. Must be one of: V4, V4_5, V4_5PLUS, V5`
    );
  }

  // Optional parameter validation (ranges)
  if (sunoConfig.styleWeight !== undefined) {
    if (sunoConfig.styleWeight < 0 || sunoConfig.styleWeight > 1) {
      throw new TemplateValidationError(
        template.id,
        'sunoConfig.styleWeight',
        `Must be between 0 and 1, got ${sunoConfig.styleWeight}`
      );
    }
  }

  if (sunoConfig.weirdnessConstraint !== undefined) {
    if (sunoConfig.weirdnessConstraint < 0 || sunoConfig.weirdnessConstraint > 1) {
      throw new TemplateValidationError(
        template.id,
        'sunoConfig.weirdnessConstraint',
        `Must be between 0 and 1, got ${sunoConfig.weirdnessConstraint}`
      );
    }
  }

  if (sunoConfig.audioWeight !== undefined) {
    if (sunoConfig.audioWeight < 0 || sunoConfig.audioWeight > 1) {
      throw new TemplateValidationError(
        template.id,
        'sunoConfig.audioWeight',
        `Must be between 0 and 1, got ${sunoConfig.audioWeight}`
      );
    }
  }
}

/**
 * Get a template by its ID
 * @param id - Template identifier
 * @returns Template or undefined if not found
 */
export function getTemplateById(id: string): MusicTemplate | undefined {
  if (id === SURPRISE_ME_TEMPLATE.id) {
    return SURPRISE_ME_TEMPLATE;
  }
  return MUSIC_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all available templates (excluding surprise mode)
 */
export function getAllTemplates(): MusicTemplate[] {
  return MUSIC_TEMPLATES;
}

/**
 * Get the surprise mode template
 */
export function getSurpriseMeTemplate(): MusicTemplate {
  return SURPRISE_ME_TEMPLATE;
}

/**
 * Predefined music templates
 */
export const MUSIC_TEMPLATES: MusicTemplate[] = [
  {
    id: 'romantic-ballad',
    name: 'Romantische Ballad',
    description: 'Rustig, emotioneel, met piano en strijkers. Perfect voor diepe gevoelens.',
    previewAudioUrl: '/templates/romantic-ballad-preview.mp3',
    imageUrl: '/templates/romantic-ballad-cover.jpg',
    icon: '🎹',
    sunoConfig: {
      style: 'slow romantic ballad with piano and strings',
      tags: 'ballad, romantic, emotional, piano, orchestral',
      model: 'V5',
      styleWeight: 0.85,
      weirdnessConstraint: 0.3, // Keep it safe and predictable
      audioWeight: 0.6,
    },
  },
  {
    id: 'upbeat-pop',
    name: 'Vrolijke Pop',
    description: 'Energiek, catchy, modern. Voor een positieve, vrolijke vibe.',
    previewAudioUrl: '/templates/upbeat-pop-preview.mp3',
    imageUrl: '/templates/upbeat-pop-cover.jpg',
    icon: '🎵',
    sunoConfig: {
      style: 'upbeat modern pop with synths and drums',
      tags: 'pop, upbeat, catchy, energetic, modern',
      model: 'V5',
      styleWeight: 0.8,
      weirdnessConstraint: 0.5,
      audioWeight: 0.7,
    },
  },
  {
    id: 'acoustic-intimate',
    name: 'Akoestisch Intiem',
    description: 'Gitaar, zacht, persoonlijk. Voor een intieme, authentieke sfeer.',
    previewAudioUrl: '/templates/acoustic-intimate-preview.mp3',
    imageUrl: '/templates/acoustic-intimate-cover.jpg',
    icon: '🎸',
    sunoConfig: {
      style: 'soft acoustic guitar ballad, intimate and warm',
      tags: 'acoustic, intimate, guitar, soft, warm, personal',
      model: 'V5',
      styleWeight: 0.9,
      weirdnessConstraint: 0.2,
      audioWeight: 0.5,
    },
  },
];

/**
 * "Verras Me" template - Maximum creativity, minimal constraints
 */
export const SURPRISE_ME_TEMPLATE: MusicTemplate = {
  id: 'surprise-me',
  name: '✨ Verras me',
  description: 'Laat Suno helemaal los! Onvoorspelbaar en uniek.',
  previewAudioUrl: '', // No preview for surprise mode
  imageUrl: '/templates/surprise-me-cover.jpg',
  icon: '✨',
  sunoConfig: {
    style: '', // Empty = max creativity
    tags: 'love song', // Minimal constraint per Task 10.1
    model: 'V5',
    weirdnessConstraint: 0.8, // Encourage creative deviations
  },
};

// Validate all templates on module load (development safety check)
if (process.env.NODE_ENV === 'development') {
  [...MUSIC_TEMPLATES, SURPRISE_ME_TEMPLATE].forEach((template) => {
    try {
      validateTemplate(template);
    } catch (error) {
      console.error('Template validation failed:', error);
    }
  });
}
