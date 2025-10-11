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
      type: i.string().optional(),
    }),
    conversations: i.entity({
      createdAt: i.number().indexed().optional(),
      currentStep: i.number().optional(),
      status: i.string().indexed().optional(),
      extractedContext: i.string().optional(), // Stores JSON of ExtractedContext interface
      conversationPhase: i.string().indexed().optional(), // 'gathering' | 'generating' | 'refining' | 'complete'
      roundNumber: i.number().optional(), // Current conversation round counter
      readinessScore: i.number().optional(), // 0-1 score indicating readiness for lyrics generation
      songSettings: i.string().optional(), // JSON of UserPreferences (language, vocalGender, mood)
    }),
    messages: i.entity({
      content: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      role: i.string().optional(),
      composerContext: i.string().optional(),
    }),
    songs: i.entity({
      audioUrl: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      errorMessage: i.string().optional(),
      generationModel: i.string().optional(),
      generationParams: i.string().optional(),
      instrumental: i.boolean().optional(),
      lyrics: i.string().optional(),
      musicStyle: i.string().optional(),
      status: i.string().indexed().optional(),
      sunoTaskId: i.string().optional(),
      sunoTrackId: i.string().optional(),
      streamAudioUrl: i.string().optional(),
      sourceAudioUrl: i.string().optional(),
      sourceStreamAudioUrl: i.string().optional(),
      durationSeconds: i.number().optional(),
      modelName: i.string().optional(),
      prompt: i.string().optional(),
      callbackData: i.string().optional(),
      title: i.string().optional(),
      version: i.number().optional(),
      imageUrl: i.string().optional(),
      videoUrl: i.string().optional(),
      // Task 5.1, 5.2: Template-related fields
      templateId: i.string().indexed().optional(), // Selected template ID
      lyricsTaskId: i.string().optional(), // Suno lyrics generation task ID
    }),
    sunoVariants: i.entity({
      songId: i.string().indexed(),
      trackId: i.string().indexed(),
      title: i.string().optional(),
      audioUrl: i.string().optional(),
      streamAudioUrl: i.string().optional(),
      sourceAudioUrl: i.string().optional(),
      sourceStreamAudioUrl: i.string().optional(),
      imageUrl: i.string().optional(),
      durationSeconds: i.number().optional(),
      modelName: i.string().optional(),
      prompt: i.string().optional(),
      tags: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      order: i.number().optional(),
      // Task 5.3, 5.4: Progressive loading timestamps
      streamAvailableAt: i.number().optional(), // Timestamp when streaming URL became available
      downloadAvailableAt: i.number().optional(), // Timestamp when download URL became available
    }),
    todos: i.entity({
      createdAt: i.number().optional(),
      done: i.boolean().optional(),
      text: i.string().optional(),
    }),
    lyric_versions: i.entity({
      content: i.string().optional(),
      label: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      hash: i.string().indexed().optional(),
      version: i.number().optional(),
      variantIndex: i.number().optional(),
      variantSource: i.string().optional(),
      isManual: i.boolean().optional(),
      isRefined: i.boolean().optional(),
      isSelection: i.boolean().optional(),
      selectedAt: i.number().optional(),
      selectedFromTaskId: i.string().optional(),
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
    sunoVariantSong: {
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
    lyricVersionsConversation: {
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
    lyricVersionsSong: {
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
