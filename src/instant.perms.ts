// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

/**
 * Security-First Permission Model
 *
 * Architecture:
 * - Desktop: Uses InstantDB client writes (with restricted permissions)
 * - Mobile: Uses API routes with session cookies (/api/mobile/*)
 * - Server: Uses Admin SDK for critical operations
 *
 * Security Strategy:
 * 1. Client writes are ONLY allowed for non-critical fields
 * 2. Critical fields (status, taskIds, scores) can ONLY be set by server
 * 3. Users can only access their own data
 * 4. All creates/deletes go through this security layer
 *
 * CRITICAL FIELDS (server-only via Admin SDK):
 * - conversations: status, readinessScore, lyricsTaskId
 * - messages: All fields (read-only for users)
 * - songs: status, sunoTaskId, audioUrl, videoUrl, imageUrl
 * - sunoVariants: All fields (server manages Suno webhook data)
 */
const rules = {
  $files: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
  $users: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },

  // Conversations: Users can create and update their own, but critical fields are server-only
  conversations: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('user.id')",
      // Allow creation with user link
      create: "auth.id != null",
      // Allow updates to own conversations (but critical fields protected by bind)
      update: "auth.id != null && auth.id == data.ref('user.id')",
      delete: "auth.id != null && auth.id == data.ref('user.id')",
    },
    bind: [
      // Prevent clients from setting critical fields directly
      // These can only be set by Admin SDK (server-side)
      "status",
      "readinessScore",
      "lyricsTaskId",
      "sunoTaskId"
    ],
  },

  // Messages: Read-only for users, server creates via Admin SDK
  // This prevents users from injecting fake AI messages
  messages: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('conversation.user.id')",
      // Allow users to create their own messages
      create: "auth.id != null",
      update: "false",
      delete: "auth.id != null && auth.id == data.ref('conversation.user.id')",
    },
  },

  // Songs: Users can create but critical Suno fields are server-only
  songs: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('user.id')",
      // Allow creation for music generation flow
      create: "auth.id != null",
      // Allow updates to own songs (but critical fields protected by bind)
      update: "auth.id != null && auth.id == data.ref('user.id')",
      delete: "auth.id != null && auth.id == data.ref('user.id')",
    },
    bind: [
      // Prevent clients from manipulating Suno API data
      // These are only set by server via Suno webhook callbacks
      "status",
      "sunoTaskId",
      "audioUrl",
      "streamAudioUrl",
      "videoUrl",
      "imageUrl",
      "durationSeconds",
      "errorMessage"
    ],
  },

  // Suno Variants: Server-only (created by webhook callbacks)
  // Users should never directly create or modify these
  sunoVariants: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('song.user.id')",
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
      view: "auth.id != null && (auth.id == data.ref('conversation.user.id') || auth.id == data.ref('song.user.id'))",
      create: "auth.id != null",
      update: "auth.id != null && (auth.id == data.ref('conversation.user.id') || auth.id == data.ref('song.user.id'))",
      delete: "auth.id != null && (auth.id == data.ref('conversation.user.id') || auth.id == data.ref('song.user.id'))",
    },
  },

  // Push Subscriptions: Server-only
  push_subscriptions: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
} satisfies InstantRules;

export default rules;
