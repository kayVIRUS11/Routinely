"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, Trash2, Target } from "lucide-react";
import { db, makeRecord, type DbPersonalGoal } from "@/db/db";
import { cn } from "@/lib/utils";

interface GoalsSectionProps {
  modeId: string;
}

export default function GoalsSection({ modeId }: GoalsSectionProps) {
  const [goals, setGoals] = useState<DbPersonalGoal[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const load = useCallback(async () => {
    const rows = await db.personal_goals
      .filter((g) => !g.is_deleted)
      .sortBy("created_at");
    setGoals(rows);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!newTitle.trim()) return;
    const goal = makeRecord<DbPersonalGoal>({
      title: newTitle.trim(),
      description: null,
      target_date: null,
      completed: false,
    });
    await db.personal_goals.add(goal);
    setNewTitle("");
    void load();
  };

  const toggle = async (id: string, completed: boolean) => {
    await db.personal_goals.update(id, { completed: !completed, updated_at: new Date().toISOString() });
    void load();
  };

  const del = async (id: string) => {
    await db.personal_goals.update(id, { is_deleted: true, updated_at: new Date().toISOString() });
    void load();
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

      <ul className="flex flex-col gap-2">
        {[...active, ...done].map((g) => (
          <li key={g.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl group">
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
                g.completed ? "line-through text-text-secondary" : "text-text-primary",
              )}
            >
              {g.title}
            </span>
            <button
              onClick={() => void del(g.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-error transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
