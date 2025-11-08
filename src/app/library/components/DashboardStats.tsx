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
      className={`flex min-w-[158px] flex-1 flex-col gap-2 rounded-2xl p-4 transition ${
        highlighted
          ? "bg-[#F9FAFB] border border-[#F9FAFB]"
          : "bg-[#F9FAFB]"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          {label}
        </p>
        <span className={`text-lg ${highlighted ? 'text-[#A855F7]' : 'text-[#84CC16]'}`}>{icon}</span>
      </div>
      <p className="mt-4 text-4xl font-semibold text-[#262626]">
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