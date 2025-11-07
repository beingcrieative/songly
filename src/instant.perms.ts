// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  $users: {
    allow: {
      view: "false",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  todos: {
    allow: {
      view: "false",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  messages: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('conversation.user.id')",
      create: "auth.id != null",
      delete: "auth.id != null && auth.id in data.ref('conversation.user.id')",
      update: "false",
    },
  },
  lyric_versions: {
    allow: {
      view: "auth.id != null && (auth.id in data.ref('conversation.user.id') || auth.id in data.ref('song.user.id'))",
      create: "auth.id != null",
      delete:
        "auth.id != null && (auth.id in data.ref('conversation.user.id') || auth.id in data.ref('song.user.id'))",
      update:
        "auth.id != null && (auth.id in data.ref('conversation.user.id') || auth.id in data.ref('song.user.id'))",
    },
  },
  songs: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('user.id')",
      create: "auth.id != null",
      delete: "auth.id != null && auth.id in data.ref('user.id')",
      update: "auth.id != null && auth.id in data.ref('user.id')",
    },
  },
  projects: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('user.id')",
      create: "auth.id != null",
      delete: "auth.id != null && auth.id in data.ref('user.id')",
      update: "auth.id != null && auth.id in data.ref('user.id')",
    },
  },
  conversations: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('user.id')",
      create: "auth.id != null",
      delete: "auth.id != null && auth.id in data.ref('user.id')",
      update: "auth.id != null && auth.id in data.ref('user.id')",
    },
  },
  sunoVariants: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('song.user.id')",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  $files: {
    allow: {
      view: "false",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  push_subscriptions: {
    allow: {
      view: "false",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
} satisfies InstantRules;

export default rules;
