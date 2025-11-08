"use client";

import { useLibraryStats } from "@/hooks/useLibraryStats";

interface DashboardStatsProps {
  songs: any[];
  conversations: any[];
  isLoading?: boolean;
}

export default function DashboardStats({
  songs,
  conversations,
  isLoading = false,
}: DashboardStatsProps) {
  const stats = useLibraryStats(songs, conversations, isLoading);

  const StatCard = ({
    label,
    value,
    icon,
    highlighted = false,
  }: {
    label: string;
    value: number;
    icon: string;
    highlighted?: boolean;
  }) => (
    <div
      className={`flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-4 shadow-sm transition ${
        highlighted
          ? "border border-[#6A11CB]/50 bg-gradient-to-br from-[#6A11CB]/10 to-[#FF00A5]/5"
          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {label}
        </p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-4 px-4">
      <StatCard label="Total Songs" value={stats.totalSongs} icon="🎵" />
      <StatCard
        label="Conversations"
        value={stats.totalConversations}
        icon="💬"
      />
      <StatCard
        label="Generating"
        value={stats.generating}
        icon="⚡"
        highlighted={true}
      />
    </div>
  );
}