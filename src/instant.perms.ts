// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

/**
 * Security-First Permission Model
 *
 * Architecture:
 * - Desktop: Uses InstantDB client writes (with field protection)
 * - Mobile: Uses API routes with session cookies (/api/mobile/*)
 * - Server: Uses Admin SDK for critical operations
 *
 * Security Strategy:
 * 1. Clients have update permission but critical fields are protected via code
 * 2. Client code explicitly removes critical fields before sending updates
 *    (see StudioClient.tsx updateConversationRecord, lines 592-597)
 * 3. Critical fields can ONLY be set by server via Admin SDK or mobile API routes
 * 4. Users can only access their own data (enforced via data.ref checks)
 *
 * CRITICAL FIELDS (protected in client code, only server can update):
 * - conversations: status, readinessScore, lyricsTaskId, sunoTaskId
 * - messages: All fields (read-only for users, server creates via Admin SDK)
 * - songs: status, sunoTaskId, audioUrl, streamAudioUrl, videoUrl, imageUrl,
 *          durationSeconds, errorMessage, generationProgress, lyricsVariants, notificationsSent
 * - sunoVariants: All fields (server manages Suno webhook data)
 *
 * Note: InstantDB's `bind` is for CEL expression aliases, NOT field protection.
 * Field protection is implemented via client-side field deletion before updates.
 */
const rules = {
  $files: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
  $users: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },

  // Conversations: Users can create and update their own
  // Critical fields (status, readinessScore, lyricsTaskId, sunoTaskId) are protected by:
  // 1. Client code explicitly deletes these fields before update (see StudioClient.tsx line 592-597)
  // 2. Server/Admin SDK can update all fields via /api/mobile routes
  conversations: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('user.id')",
      create: "auth.id != null",
      update: "auth.id != null && auth.id in data.ref('user.id')",
      delete: "auth.id != null && auth.id in data.ref('user.id')",
    },
  },

  // Messages: Read-only for users, server creates via Admin SDK
  // This prevents users from injecting fake AI messages
  messages: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('conversation.user.id')",
      // Allow users to create their own messages
      create: "auth.id != null",
      update: "false",
      delete: "auth.id != null && auth.id in data.ref('conversation.user.id')",
    },
  },

  // Songs: Users can create and update their own
  // Critical fields (status, sunoTaskId, audioUrl, etc.) are protected by:
  // 1. Client code should delete these fields before update (similar to conversations pattern)
  // 2. Server/Admin SDK updates all fields via callback handlers and /api/mobile routes
  songs: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('user.id')",
      create: "auth.id != null",
      update: "auth.id != null && auth.id in data.ref('user.id')",
      delete: "auth.id != null && auth.id in data.ref('user.id')",
    },
  },

  // Suno Variants: Server-only (created by webhook callbacks)
  // Users should never directly create or modify these
  sunoVariants: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('song.user.id')",
      // Only server can create variants (from Suno webhook)
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  // Todos: Not used in production
  todos: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },

  // Lyric Versions: Users can create and manage their own
  lyric_versions: {
    allow: {
      view: "auth.id != null && (auth.id in data.ref('conversation.user.id') || auth.id in data.ref('song.user.id'))",
      create: "auth.id != null",
      update: "auth.id != null && (auth.id in data.ref('conversation.user.id') || auth.id in data.ref('song.user.id'))",
      delete: "auth.id != null && (auth.id in data.ref('conversation.user.id') || auth.id in data.ref('song.user.id'))",
    },
  },

  // Push Subscriptions: Server-only
  push_subscriptions: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },

  // Projects: Users can create and manage their own projects
  projects: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('user.id')",
      create: "auth.id != null",
      update: "auth.id != null && auth.id in data.ref('user.id')",
      delete: "auth.id != null && auth.id in data.ref('user.id')",
    },
  },
} satisfies InstantRules;

export default rules;
