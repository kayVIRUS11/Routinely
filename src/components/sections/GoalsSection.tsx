"use client";

import { useState } from "react";
import { Plus, Check, Trash2, Target } from "lucide-react";
import { db, makeRecord, type DbPersonalGoal } from "@/db/db";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { cn } from "@/lib/utils";
import { awardXP, getCurrentUserId } from "@/lib/stats";

interface GoalsSectionProps {
  modeId: string;
}

// GoalsSection intentionally shows all personal goals regardless of modeId —
// personal goals are user-wide and not scoped to a specific mode.
export default function GoalsSection({ modeId: _modeId }: GoalsSectionProps) {
  const [newTitle, setNewTitle] = useState("");

  const goals =
    useLiveQuery(
      () =>
        db.personal_goals
          .filter((g) => !g.is_deleted)
          .sortBy("created_at"),
      [],
    ) ?? [];

  const add = async () => {
    if (!newTitle.trim()) return;
    const goal = makeRecord<DbPersonalGoal>({
      title: newTitle.trim(),
      description: null,
      target_date: null,
      completed: false,
      progress: 0,
      completed_at: null,
    });
    await db.personal_goals.add(goal);
    setNewTitle("");
  };

  const updateProgress = async (id: string, progress: number) => {
    const now = new Date().toISOString();
    const completed = progress >= 100;
    // Check if previously incomplete to prevent XP farming
    const existingGoal = goals.find((g) => g.id === id);
    const wasAlreadyComplete = existingGoal?.completed ?? false;
    await db.personal_goals.update(id, {
      progress,
      completed,
      completed_at: completed ? now : null,
      updated_at: now,
    });
    if (completed && !wasAlreadyComplete) {
      const userId = getCurrentUserId();
      if (userId) await awardXP(userId, "drive", 50);
    }
  };

  const markComplete = async (id: string) => {
    await updateProgress(id, 100);
  };

  const toggle = async (id: string, completed: boolean) => {
    const now = new Date().toISOString();
    await db.personal_goals.update(id, {
      completed: !completed,
      progress: !completed ? 100 : 0,
      completed_at: !completed ? now : null,
      updated_at: now,
    });
  };

  const del = async (id: string) => {
    await db.personal_goals.update(id, {
      is_deleted: true,
      updated_at: new Date().toISOString(),
    });
  };

  const active = goals.filter((g) => !g.completed);
  const done = goals.filter((g) => g.completed);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Add a goal…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
        />
        <button
          onClick={() => void add()}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {active.length === 0 && done.length === 0 && (
        <p className="text-sm text-text-secondary">No goals yet. Add one above.</p>
      )}

      <ul className="flex flex-col gap-3">
        {[...active, ...done].map((g) => (
          <li key={g.id} className="p-3 bg-card border border-border rounded-xl group">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => void toggle(g.id, g.completed)}
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  g.completed
                    ? "border-success bg-success text-white"
                    : "border-border hover:border-primary",
                )}
              >
                {g.completed && <Check className="w-3 h-3" />}
              </button>
              <Target className="w-4 h-4 text-yellow-400 shrink-0" />
              <span
                className={cn(
                  "flex-1 text-sm",
                  g.completed
                    ? "line-through text-text-secondary"
                    : "text-text-primary",
                )}
              >
                {g.title}
              </span>
              {!g.completed && (
                <button
                  onClick={() => void markComplete(g.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-all"
                >
                  Mark done
                </button>
              )}
              <button
                onClick={() => void del(g.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-error transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress slider */}
            <div className="pl-8 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={g.progress ?? 0}
                onChange={(e) => void updateProgress(g.id, parseInt(e.target.value))}
                disabled={g.completed}
                className="flex-1 h-1.5 accent-primary cursor-pointer disabled:opacity-40"
              />
              <span className="text-xs text-text-secondary w-8 text-right">
                {g.progress ?? 0}%
              </span>
            </div>
            <div className="pl-8 mt-1">
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    g.completed ? "bg-success" : "bg-primary",
                  )}
                  style={{ width: `${g.progress ?? 0}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
