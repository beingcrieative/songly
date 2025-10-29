"use client";

import { useState } from "react";
import { Edit2, Archive, Trash2, Copy, X } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  isArchived?: boolean | null;
}

interface ProjectManagementPanelProps {
  project: Project;
  onClose: () => void;
  onRename: (newName: string, newDescription?: string) => Promise<void>;
  onArchive: (isArchived: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate?: () => Promise<void>;
  loading?: boolean;
}

/**
 * ProjectManagementPanel Component
 * Manages project operations like rename, archive, and delete
 * Provides a safe UI for destructive actions with confirmation
 */
export function ProjectManagementPanel({
  project,
  onClose,
  onRename,
  onArchive,
  onDelete,
  onDuplicate,
  loading = false,
}: ProjectManagementPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async () => {
    if (!editName.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      await onRename(editName.trim(), editDescription.trim() || undefined);
      setEditMode(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename project");
    }
  };

  const handleArchive = async () => {
    try {
      await onArchive(!project.isArchived);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  if (editMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900">Edit Project</h2>
            <button
              onClick={() => setEditMode(false)}
              className="rounded-full p-2 hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
            className="flex flex-col gap-4 px-6 py-4"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={2}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900">Delete Project?</h2>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-full p-2 hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <div className="px-6 py-4">
            <p className="text-sm text-slate-700 mb-4">
              Are you sure you want to delete <strong>"{project.name}"</strong>? This action cannot be undone.
            </p>
            <p className="text-xs text-slate-600 mb-6">
              Songs and conversations will remain, but will no longer be associated with this project.
            </p>

            {error && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-2 border-t border-slate-200 pt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main panel
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Manage Project</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-6 py-4">
          {/* Rename */}
          <button
            onClick={() => setEditMode(true)}
            disabled={loading}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Edit2 className="h-5 w-5 text-blue-600" />
            <span>Rename Project</span>
          </button>

          {/* Archive */}
          <button
            onClick={handleArchive}
            disabled={loading}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Archive className="h-5 w-5 text-amber-600" />
            <span>
              {project.isArchived ? "Unarchive Project" : "Archive Project"}
            </span>
          </button>

          {/* Duplicate */}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              disabled={loading}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Copy className="h-5 w-5 text-emerald-600" />
              <span>Duplicate Project</span>
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition hover:bg-rose-50 disabled:opacity-60"
          >
            <Trash2 className="h-5 w-5 text-rose-600" />
            <span className="text-rose-600">Delete Project</span>
          </button>
        </div>

        {error && (
          <div className="border-t border-slate-200 px-6 py-4 bg-rose-50">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectManagementPanel;
