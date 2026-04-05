"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { db, makeRecord, todayISO, type DbJournalEntry } from "@/db/db";

interface LogSectionProps {
  modeId: string;
}

export default function LogSection({ modeId }: LogSectionProps) {
  const [entries, setEntries] = useState<DbJournalEntry[]>([]);
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    const rows = await db.journal_entries
      .filter((e) => !e.is_deleted)
      .reverse()
      .sortBy("entry_date");
    setEntries(rows.reverse());
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!body.trim()) return;
    const entry = makeRecord<DbJournalEntry>({
      title: null,
      body: body.trim(),
      entry_date: todayISO(),
      mood: null,
    });
    await db.journal_entries.add(entry);
    setBody("");
    void load();
  };

  const del = async (id: string) => {
    await db.journal_entries.update(id, { is_deleted: true, updated_at: new Date().toISOString() });
    void load();
  };

  return (
    <div>
      <div className="mb-4">
        <textarea
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          placeholder="Log what happened today…"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          onClick={() => void add()}
          className="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add log entry
        </button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-text-secondary">No log entries yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl group">
            <BookOpen className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary mb-1">{e.entry_date}</p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{e.body}</p>
            </div>
            <button
              onClick={() => void del(e.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-error transition-all shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
