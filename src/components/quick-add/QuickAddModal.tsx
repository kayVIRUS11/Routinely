"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { db, makeRecord, type DbTask } from "@/db/db";
import { cn } from "@/lib/utils";

const BUILTIN_MODES = [
  { id: "study", label: "Study" },
  { id: "professional", label: "Professional" },
  { id: "fitness", label: "Fitness" },
  { id: "financial", label: "Financial" },
  { id: "general", label: "General" },
];

interface QuickAddModalProps {
  onClose: () => void;
}

export default function QuickAddModal({ onClose }: QuickAddModalProps) {
  const [title, setTitle] = useState("");
  const [modeId, setModeId] = useState("general");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Get custom modes from localStorage
  const customModes: { id: string; name: string }[] = (() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("custom_modes");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const allModes = [
    ...BUILTIN_MODES,
    ...customModes.map((m) => ({ id: m.id, label: m.name })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const task = makeRecord<DbTask>({
        mode_id: modeId,
        title: title.trim(),
        description: null,
        due_date: dueDate || null,
        completed: false,
        priority,
        is_recurring: false,
      });
      await db.tasks.add(task);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Quick Add Task</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary hidden sm:block">Ctrl+K</span>
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 flex flex-col gap-4">
          {/* Task title */}
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you need to do?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            {/* Mode selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-medium">Mode</label>
              <select
                value={modeId}
                onChange={(e) => setModeId(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {allModes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-medium">Due date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className={cn(
                "flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium transition-colors",
                loading || !title.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-primary/90",
              )}
            >
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
