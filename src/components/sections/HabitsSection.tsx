"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check } from "lucide-react";
import { db, makeRecord, todayISO, type DbHabit, type DbHabitLog } from "@/db/db";
import { cn } from "@/lib/utils";

interface HabitsSectionProps {
  modeId: string;
}

export default function HabitsSection({ modeId }: HabitsSectionProps) {
  const [habits, setHabits] = useState<DbHabit[]>([]);
  const [logs, setLogs] = useState<DbHabitLog[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const today = todayISO();

  const load = useCallback(async () => {
    const [h, l] = await Promise.all([
      db.habits.filter((h) => h.mode_id === modeId && !h.is_deleted).toArray(),
      db.habit_logs.where("logged_date").equals(today).filter((l) => !l.is_deleted).toArray(),
    ]);
    setHabits(h);
    setLogs(l);
  }, [modeId, today]);

  useEffect(() => { void load(); }, [load]);

  const addHabit = async () => {
    if (!newTitle.trim()) return;
    const habit = makeRecord<DbHabit>({
      mode_id: modeId,
      title: newTitle.trim(),
      description: null,
      frequency: "daily",
      target_count: 1,
    });
    await db.habits.add(habit);
    setNewTitle("");
    void load();
  };

  const toggleHabit = async (habit: DbHabit) => {
    const existing = logs.find((l) => l.habit_id === habit.id);
    if (existing) {
      await db.habit_logs.update(existing.id, { is_deleted: true, updated_at: new Date().toISOString() });
    } else {
      const log = makeRecord<DbHabitLog>({
        habit_id: habit.id,
        logged_date: today,
        count: 1,
      });
      await db.habit_logs.add(log);
    }
    void load();
  };

  if (habits.length === 0 && !newTitle) {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Add a habit…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void addHabit()}
          />
          <button
            onClick={() => void addHabit()}
            className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">No habits yet. Add one above.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Add a habit…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void addHabit()}
        />
        <button
          onClick={() => void addHabit()}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {habits.map((habit) => {
          const done = logs.some((l) => l.habit_id === habit.id);
          return (
            <li
              key={habit.id}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
            >
              <button
                onClick={() => void toggleHabit(habit)}
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  done
                    ? "border-success bg-success text-white"
                    : "border-border hover:border-primary",
                )}
              >
                {done && <Check className="w-3 h-3" />}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  done ? "line-through text-text-secondary" : "text-text-primary",
                )}
              >
                {habit.title}
              </span>
              <span className="text-xs text-text-secondary">Daily</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
