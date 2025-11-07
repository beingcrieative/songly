// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    conversations: i.entity({
      conceptHistory: i.string().optional(),
      conceptLyrics: i.string().optional(),
      conceptTitle: i.string().indexed().optional(),
      conversationPhase: i.string().indexed().optional(),
      createdAt: i.number().indexed().optional(),
      currentStep: i.number().optional(),
      extractedContext: i.string().optional(),
      generatedLyrics: i.string().optional(),
      lyricsStatus: i.string().optional(),
      lyricsTaskId: i.string().optional(),
      lyricsVariants: i.string().optional(),
      projectId: i.string().indexed().optional(),
      readinessScore: i.number().optional(),
      roundNumber: i.number().optional(),
      selectedTemplateId: i.string().indexed().optional(),
      songSettings: i.string().optional(),
      status: i.string().indexed().optional(),
      templateConfig: i.string().optional(),
      updatedAt: i.number().indexed().optional(),
    }),
    lyric_versions: i.entity({
      content: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      hash: i.string().indexed().optional(),
      isManual: i.boolean().optional(),
      isRefined: i.boolean().optional(),
      isSelection: i.boolean().optional(),
      label: i.string().optional(),
      selectedAt: i.number().optional(),
      selectedFromTaskId: i.string().optional(),
      variantIndex: i.number().optional(),
      variantSource: i.string().optional(),
      version: i.number().optional(),
    }),
    messages: i.entity({
      composerContext: i.string().optional(),
      content: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      role: i.string().optional(),
    }),
    projects: i.entity({
      color: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      description: i.string().optional(),
      icon: i.string().optional(),
      isArchived: i.boolean().indexed().optional(),
      name: i.string().indexed(),
      order: i.number().optional(),
      updatedAt: i.number().indexed().optional(),
    }),
    push_subscriptions: i.entity({
      allowMarketing: i.boolean().optional(),
      auth: i.string(),
      createdAt: i.number().indexed().optional(),
      endpoint: i.string().unique().indexed(),
      p256dh: i.string(),
      platform: i.string().optional(),
      ua: i.string().optional(),
    }),
    songs: i.entity({
      audioUrl: i.string().optional(),
      callbackData: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      durationSeconds: i.number().optional(),
      errorMessage: i.string().optional(),
      generationModel: i.string().optional(),
      generationParams: i.string().optional(),
      generationProgress: i.string().optional(),
      imageUrl: i.string().optional(),
      instrumental: i.boolean().optional(),
      isPublic: i.boolean().indexed().optional(),
      lastPlayedAt: i.number().indexed().optional(),
      lastViewedAt: i.number().indexed().optional(),
      lyrics: i.string().optional(),
      lyricsSnippet: i.string().indexed().optional(),
      lyricsTaskId: i.string().optional(),
      lyricsVariants: i.string().optional(),
      modelName: i.string().optional(),
      musicStyle: i.string().optional(),
      notificationsSent: i.string().optional(),
      projectId: i.string().indexed().optional(),
      prompt: i.string().optional(),
      publicId: i.string().indexed().optional(),
      selectedVariantId: i.string().optional(),
      sourceAudioUrl: i.string().optional(),
      sourceStreamAudioUrl: i.string().optional(),
      status: i.string().indexed().optional(),
      streamAudioUrl: i.string().optional(),
      sunoTaskId: i.string().optional(),
      sunoTrackId: i.string().optional(),
      templateId: i.string().indexed().optional(),
      title: i.string().indexed().optional(),
      updatedAt: i.number().indexed().optional(),
      version: i.number().optional(),
      videoUrl: i.string().optional(),
    }),
    sunoVariants: i.entity({
      audioUrl: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      downloadAvailableAt: i.number().optional(),
      durationSeconds: i.number().optional(),
      imageUrl: i.string().optional(),
      modelName: i.string().optional(),
      order: i.number().indexed().optional(),
      prompt: i.string().optional(),
      songId: i.string().indexed(),
      sourceAudioUrl: i.string().optional(),
      sourceStreamAudioUrl: i.string().optional(),
      streamAudioUrl: i.string().optional(),
      streamAvailableAt: i.number().optional(),
      tags: i.string().optional(),
      title: i.string().optional(),
      trackId: i.string().indexed(),
    }),
    todos: i.entity({
      createdAt: i.number().optional(),
      done: i.boolean().optional(),
      text: i.string().optional(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    conversationsProject: {
      forward: {
        on: "conversations",
        has: "one",
        label: "project",
        onDelete: "cascade",
      },
      reverse: {
        on: "projects",
        has: "many",
        label: "conversations",
      },
    },
    conversationsUser: {
      forward: {
        on: "conversations",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "conversations",
      },
    },
    lyric_versionsConversation: {
      forward: {
        on: "lyric_versions",
        has: "one",
        label: "conversation",
      },
      reverse: {
        on: "conversations",
        has: "many",
        label: "lyricVersions",
      },
    },
    lyric_versionsSong: {
      forward: {
        on: "lyric_versions",
        has: "one",
        label: "song",
      },
      reverse: {
        on: "songs",
        has: "many",
        label: "lyricVersions",
      },
    },
    messagesConversation: {
      forward: {
        on: "messages",
        has: "one",
        label: "conversation",
      },
      reverse: {
        on: "conversations",
        has: "many",
        label: "messages",
      },
    },
    projectsUser: {
      forward: {
        on: "projects",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "projects",
      },
    },
    push_subscriptionsUser: {
      forward: {
        on: "push_subscriptions",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "pushSubscriptions",
      },
    },
    songsConversation: {
      forward: {
        on: "songs",
        has: "one",
        label: "conversation",
      },
      reverse: {
        on: "conversations",
        has: "many",
        label: "songs",
      },
    },
    songsProject: {
      forward: {
        on: "songs",
        has: "one",
        label: "project",
        onDelete: "cascade",
      },
      reverse: {
        on: "projects",
        has: "many",
        label: "songs",
      },
    },
    songsUser: {
      forward: {
        on: "songs",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "songs",
      },
    },
    sunoVariantsSong: {
      forward: {
        on: "sunoVariants",
        has: "one",
        label: "song",
      },
      reverse: {
        on: "songs",
        has: "many",
        label: "variants",
      },
    },
  },
  rooms: {
    chat: {
      presence: i.entity({}),
    },
  },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
