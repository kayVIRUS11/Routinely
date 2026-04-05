"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";

interface TrackerEntry {
  id: string;
  label: string;
  value: string;
  unit: string;
  date: string;
}

const storageKey = (modeId: string) => `tracker_${modeId}`;

interface TrackerSectionProps {
  modeId: string;
}

export default function TrackerSection({ modeId }: TrackerSectionProps) {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");

  const load = () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey(modeId));
    setEntries(raw ? (JSON.parse(raw) as TrackerEntry[]) : []);
  };

  const persist = (updated: TrackerEntry[]) => {
    localStorage.setItem(storageKey(modeId), JSON.stringify(updated));
    setEntries(updated);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [modeId]);

  const add = () => {
    if (!label.trim() || !value.trim()) return;
    const entry: TrackerEntry = {
      id: crypto.randomUUID(),
      label: label.trim(),
      value: value.trim(),
      unit: unit.trim(),
      date: new Date().toLocaleDateString(),
    };
    persist([entry, ...entries]);
    setLabel("");
    setValue("");
    setUnit("");
  };

  const del = (id: string) => persist(entries.filter((e) => e.id !== id));

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          className="flex-1 min-w-[120px] bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="What to track…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <input
          className="w-16 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <button
          onClick={add}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-text-secondary">No tracked data yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl group">
            <TrendingUp className="w-4 h-4 text-text-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{e.label}</p>
              <p className="text-xs text-text-secondary">{e.date}</p>
            </div>
            <span className="text-sm font-bold text-text-primary">{e.value}{e.unit && <span className="text-xs text-text-secondary ml-0.5">{e.unit}</span>}</span>
            <button
              onClick={() => del(e.id)}
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
