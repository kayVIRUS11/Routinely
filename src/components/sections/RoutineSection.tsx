"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Clock, Trash2 } from "lucide-react";
import { db, makeRecord, type DbRoutine } from "@/db/db";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RoutineSectionProps {
  modeId: string;
}

export default function RoutineSection({ modeId }: RoutineSectionProps) {
  const [routines, setRoutines] = useState<DbRoutine[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const load = useCallback(async () => {
    const rows = await db.routines
      .filter((r) => r.mode_id === modeId && !r.is_deleted && r.is_active)
      .sortBy("start_time");
    setRoutines(rows);
  }, [modeId]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!title.trim()) return;
    const routine = makeRecord<DbRoutine>({
      mode_id: modeId,
      title: title.trim(),
      description: null,
      day_of_week: days,
      start_time: start,
      end_time: end,
      is_active: true,
    });
    await db.routines.add(routine);
    setTitle("");
    setAdding(false);
    void load();
  };

  const del = async (id: string) => {
    await db.routines.update(id, { is_deleted: true, updated_at: new Date().toISOString() });
    void load();
  };

  const toggleDay = (d: number) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  return (
    <div>
      {routines.length === 0 && !adding && (
        <p className="text-sm text-text-secondary mb-4">No routine slots yet.</p>
      )}

      <ul className="flex flex-col gap-2 mb-4">
        {routines.map((r) => (
          <li key={r.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl group">
            <Clock className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{r.title}</p>
              <p className="text-xs text-text-secondary">{r.start_time} – {r.end_time}</p>
              <p className="text-xs text-text-secondary">{r.day_of_week.map((d) => DAYS[d]).join(", ")}</p>
            </div>
            <button
              onClick={() => void del(r.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-error transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="p-4 bg-card border border-border rounded-xl flex flex-col gap-3">
          <input
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Slot title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-text-secondary mb-1 block">Start</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-secondary mb-1 block">End</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary" />
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {DAYS.map((d, i) => (
              <button key={d} onClick={() => toggleDay(i)}
                className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${days.includes(i) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary"}`}
              >{d}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
            <button onClick={() => void save()} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors">Save</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add slot
        </button>
      )}
    </div>
  );
}
