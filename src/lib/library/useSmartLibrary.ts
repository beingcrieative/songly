"use client";

import { useMemo } from "react";
import type { SectionType } from "@/app/library/components/SmartSection";

export interface SongWithStatus {
  id: string;
  title?: string | null;
  status?: string | null;
  updatedAt?: number | null;
  createdAt?: number | null;
  lastViewedAt?: number | null;
  conversationId?: string | null;
}

export interface SmartLibrarySection {
  type: SectionType;
  songs: SongWithStatus[];
  itemCount: number;
  hasActionItems: boolean;
}

export interface UseSmartLibraryOptions {
  expandedByDefault?: SectionType[];
}

/**
 * Priority calculation for section organization
 * Order: action_required > in_progress > completed > discovery
 */
function getSectionPriority(type: SectionType): number {
  const priorityMap: Record<SectionType, number> = {
    action_required: 1,
    in_progress: 2,
    completed: 3,
    discovery: 4,
  };
  return priorityMap[type];
}

/**
 * Categorize a song into a section based on its status
 */
function categorizeSong(song: SongWithStatus): SectionType {
  const status = song.status;

  // Action required: user must make a choice or take action
  if (status === "lyrics_ready" || status === "ready") {
    return "action_required";
  }

  // In progress: actively being generated
  if (status === "generating_lyrics" || status === "generating_music" || status === "pending") {
    return "in_progress";
  }

  // Completed: finished songs
  if (status === "complete" || status === "published") {
    return "completed";
  }

  // Failed songs go to action_required (need retry)
  if (status === "failed") {
    return "action_required";
  }

  // Discovery: unknown or other states
  return "discovery";
}

/**
 * Get icon for a section type
 */
export function getSectionIcon(type: SectionType): string {
  const iconMap: Record<SectionType, string> = {
    action_required: "⚡",
    in_progress: "🎵",
    completed: "✨",
    discovery: "🎹",
  };
  return iconMap[type];
}

/**
 * Get title for a section type
 */
export function getSectionTitle(type: SectionType, locale: string = "en"): string {
  const translations: Record<SectionType, Record<string, string>> = {
    action_required: {
      en: "Action Required",
      nl: "Actie vereist",
    },
    in_progress: {
      en: "In Progress",
      nl: "In voorbereiding",
    },
    completed: {
      en: "Completed",
      nl: "Voltooid",
    },
    discovery: {
      en: "Discovery",
      nl: "Ontdekken",
    },
  };

  return translations[type][locale] || translations[type]["en"];
}

/**
 * Get description for a section type
 */
export function getSectionDescription(type: SectionType, itemCount: number, locale: string = "en"): string {
  const translations: Record<SectionType, Record<string, (count: number) => string>> = {
    action_required: {
      en: (count) => `${count} ${count === 1 ? "item" : "items"} need your attention`,
      nl: (count) => `${count} ${count === 1 ? "item" : "items"} wacht op uw aandacht`,
    },
    in_progress: {
      en: (count) => `${count} ${count === 1 ? "song" : "songs"} being generated`,
      nl: (count) => `${count} ${count === 1 ? "liedje" : "liedjes"} worden gegenereerd`,
    },
    completed: {
      en: (count) => `${count} ${count === 1 ? "completed" : "completed"} ${count === 1 ? "song" : "songs"}`,
      nl: (count) => `${count} ${count === 1 ? "voltooid" : "voltooide"} ${count === 1 ? "liedje" : "liedjes"}`,
    },
    discovery: {
      en: (count) => `Explore ${count} ${count === 1 ? "item" : "items"}`,
      nl: (count) => `Verken ${count} ${count === 1 ? "item" : "items"}`,
    },
  };

  return translations[type][locale]?.(itemCount) || translations[type]["en"](itemCount);
}

/**
 * useSmartLibrary Hook
 * Organizes songs into smart sections based on their status
 * Returns grouped sections with priority-based ordering
 */
export function useSmartLibrary(
  songs: SongWithStatus[] = [],
  options: UseSmartLibraryOptions = {}
) {
  const { expandedByDefault = ["action_required", "in_progress"] } = options;

  const sections = useMemo(() => {
    // Initialize sections map
    const sectionsMap = new Map<SectionType, SongWithStatus[]>([
      ["action_required", []],
      ["in_progress", []],
      ["completed", []],
      ["discovery", []],
    ]);

    // Categorize each song
    songs.forEach((song) => {
      const category = categorizeSong(song);
      const categoryList = sectionsMap.get(category) || [];
      categoryList.push(song);
      sectionsMap.set(category, categoryList);
    });

    // Build sections array with proper sorting
    const result: SmartLibrarySection[] = [];

    sectionsMap.forEach((songsInCategory, type) => {
      // Sort songs within category by recency
      const sortedSongs = [...songsInCategory].sort((a, b) => {
        const aTime = a.lastViewedAt || a.updatedAt || a.createdAt || 0;
        const bTime = b.lastViewedAt || b.updatedAt || b.createdAt || 0;
        return bTime - aTime;
      });

      result.push({
        type,
        songs: sortedSongs,
        itemCount: sortedSongs.length,
        hasActionItems: type === "action_required" && sortedSongs.length > 0,
      });
    });

    // Sort sections by priority
    result.sort((a, b) => {
      const aPriority = getSectionPriority(a.type);
      const bPriority = getSectionPriority(b.type);
      return aPriority - bPriority;
    });

    return result;
  }, [songs]);

  // Calculate total action items across all sections
  const actionItemsCount = useMemo(() => {
    return sections.reduce((count, section) => {
      if (section.type === "action_required") {
        return count + section.itemCount;
      }
      return count;
    }, 0);
  }, [sections]);

  // Calculate expansion state
  const expandedState = useMemo(() => {
    const state: Record<SectionType, boolean> = {
      action_required: expandedByDefault.includes("action_required"),
      in_progress: expandedByDefault.includes("in_progress"),
      completed: expandedByDefault.includes("completed"),
      discovery: expandedByDefault.includes("discovery"),
    };
    return state;
  }, [expandedByDefault]);

  return {
    sections,
    actionItemsCount,
    expandedState,
    getSectionIcon,
    getSectionTitle,
    getSectionDescription,
    hasAnyActionItems: actionItemsCount > 0,
  };
}

export default useSmartLibrary;
