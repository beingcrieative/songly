"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronDown, FolderOpen } from "lucide-react";

interface Project {
  id: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  songCount?: number;
  conversationCount?: number;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId?: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: () => void;
  onEditProject?: (projectId: string) => void;
  loading?: boolean;
  compact?: boolean;
}

/**
 * ProjectSelector Component
 * Allows users to select, create, and manage projects
 * Provides navigation between projects in the library
 */
export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onEditProject,
  loading = false,
  compact = false,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const allProjects = useMemo(() => {
    return [
      { id: null, name: "All Songs", icon: "🎵", color: "slate" },
      ...projects,
    ];
  }, [projects]);

  const handleSelect = (projectId: string | null) => {
    onSelectProject(projectId);
    setIsOpen(false);
  };

  const getColorStyle = (color?: string | null) => {
    const colorMap: Record<string, string> = {
      rose: "bg-rose-100 text-rose-700 border-rose-200",
      amber: "bg-amber-100 text-amber-700 border-amber-200",
      emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      slate: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return colorMap[color || "slate"] || colorMap.slate;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {selectedProject?.icon && <span className="text-base">{selectedProject.icon}</span>}
          {selectedProject?.name || "All Songs"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 min-w-[280px] rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex flex-col gap-1 p-2">
              {allProjects.map((project) => (
                <button
                  key={project.id || "all"}
                  onClick={() => handleSelect(project.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    selectedProjectId === project.id
                      ? "bg-slate-100 text-slate-900"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-lg">{project.icon}</span>
                  <div className="flex-1">
                    <div>{project.name}</div>
                    {project.songCount !== undefined && (
                      <div className="text-xs text-slate-500">
                        {project.songCount} songs
                      </div>
                    )}
                  </div>
                </button>
              ))}

              <div className="my-1 border-t border-slate-200" />

              <button
                onClick={onCreateProject}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full width selector
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Projects</h3>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {/* All Songs option */}
        <button
          onClick={() => handleSelect(null)}
          className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition ${
            selectedProjectId === null || selectedProjectId === undefined
              ? "border-slate-300 bg-slate-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <FolderOpen className="h-5 w-5 flex-shrink-0 text-slate-600" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900">All Songs</div>
            <p className="text-xs text-slate-500">
              {projects.reduce((sum, p) => sum + (p.songCount || 0), 0)} items
            </p>
          </div>
        </button>

        {/* Project list */}
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleSelect(project.id)}
            className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition ${
              selectedProjectId === project.id
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {project.icon && (
              <span className="text-2xl flex-shrink-0">{project.icon}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 truncate">
                {project.name}
              </div>
              {project.description && (
                <p className="text-xs text-slate-500 line-clamp-1">
                  {project.description}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {(project.songCount || 0) + (project.conversationCount || 0)} items
              </p>
            </div>
            {onEditProject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProject(project.id);
                }}
                className="rounded p-1 hover:bg-slate-200"
              >
                ⚙️
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProjectSelector;
