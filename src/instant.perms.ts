// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

// Default‑deny policy: no client-side writes unless explicitly allowed.
// NOTE: Server routes continue to use the admin SDK for persistence on behalf of the user.
const rules = {
  $files: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
  $users: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
  conversations: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('user.id')",
      create: "false",
      update: "false",
      delete: "auth.id != null && auth.id == data.ref('user.id')",
    },
  },
  messages: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
  songs: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('user.id')",
      create: "false",
      update: "false",
      delete: "auth.id != null && auth.id == data.ref('user.id')",
    },
  },
  sunoVariants: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('song.user.id')",
      create: "false",
      update: "false",
      delete: "false",
    },
  },
  todos: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
  lyric_versions: {
    allow: {
      view: "auth.id != null && (auth.id == data.ref('conversation.user.id') || auth.id == data.ref('song.user.id'))",
      create: "false",
      update: "false",
      delete: "auth.id != null && (auth.id == data.ref('conversation.user.id') || auth.id == data.ref('song.user.id'))",
    },
  },
  push_subscriptions: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
} satisfies InstantRules;

export default rules;
