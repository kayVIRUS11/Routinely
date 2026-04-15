"use client";

import { useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { db, makeRecord, type DbTask } from "@/db/db";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { cn } from "@/lib/utils";
import { awardXP } from "@/lib/stats";

interface TasksSectionProps {
  modeId: string;
}

export default function TasksSection({ modeId }: TasksSectionProps) {
  const [newTitle, setNewTitle] = useState("");

  const tasks =
    useLiveQuery(
      () =>
        db.tasks
          .filter((t) => t.mode_id === modeId && !t.is_deleted)
          .sortBy("created_at"),
      [modeId],
    ) ?? [];

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const task = makeRecord<DbTask>({
      mode_id: modeId,
      title: newTitle.trim(),
      description: null,
      due_date: null,
      completed: false,
      priority: "medium",
      is_recurring: false,
    });
    await db.tasks.add(task);
    setNewTitle("");
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await db.tasks.update(id, {
      completed: !completed,
      updated_at: new Date().toISOString(),
    });
    if (!completed) {
      // Completing a task — award XP
      const userId =
        typeof window !== "undefined"
          ? (localStorage.getItem("routinely_user_id") ??
            localStorage.getItem("routinely_guest_user_id"))
          : null;
      if (userId) await awardXP(userId, "drive", 10);
    }
  };

  const deleteTask = async (id: string) => {
    await db.tasks.update(id, {
      is_deleted: true,
      updated_at: new Date().toISOString(),
    });
  };

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Add a task…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void addTask()}
        />
        <button
          onClick={() => void addTask()}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {pending.length === 0 && done.length === 0 && (
        <p className="text-sm text-text-secondary">No tasks yet. Add one above.</p>
      )}

      <ul className="flex flex-col gap-2">
        {pending.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
        ))}
        {done.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
        ))}
      </ul>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: DbTask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl group">
      <button
        onClick={() => onToggle(task.id, task.completed)}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
          task.completed
            ? "border-success bg-success text-white"
            : "border-border hover:border-primary",
        )}
      >
        {task.completed && <Check className="w-3 h-3" />}
      </button>
      <span
        className={cn(
          "flex-1 text-sm",
          task.completed ? "line-through text-text-secondary" : "text-text-primary",
        )}
      >
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-error transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}
