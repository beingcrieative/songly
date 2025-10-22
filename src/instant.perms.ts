// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

// Permission model: Allow authenticated users to read and write their own data
// Server routes can also use the admin SDK for operations requiring elevated permissions
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
      create: "auth.id != null",
      update: "auth.id != null && auth.id == data.ref('user.id')",
      delete: "auth.id != null && auth.id == data.ref('user.id')",
    },
  },
  messages: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('conversation.user.id')",
      create: "auth.id != null",
      update: "false",
      delete: "auth.id != null && auth.id == data.ref('conversation.user.id')",
    },
  },
  songs: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('user.id')",
      create: "auth.id != null",
      update: "auth.id != null && auth.id == data.ref('user.id')",
      delete: "auth.id != null && auth.id == data.ref('user.id')",
    },
  },
  sunoVariants: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('song.user.id')",
      create: "auth.id != null",
      update: "auth.id != null && auth.id == data.ref('song.user.id')",
      delete: "auth.id != null && auth.id == data.ref('song.user.id')",
    },
  },
  todos: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
  lyric_versions: {
    allow: {
      view: "auth.id != null && (auth.id == data.ref('conversation.user.id') || auth.id == data.ref('song.user.id'))",
      create: "auth.id != null",
      update: "auth.id != null && (auth.id == data.ref('conversation.user.id') || auth.id == data.ref('song.user.id'))",
      delete: "auth.id != null && (auth.id == data.ref('conversation.user.id') || auth.id == data.ref('song.user.id'))",
    },
  },
  push_subscriptions: {
    allow: { view: "false", create: "false", update: "false", delete: "false" },
  },
} satisfies InstantRules;

export default rules;
