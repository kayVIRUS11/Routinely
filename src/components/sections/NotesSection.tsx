"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Note {
  id: string;
  body: string;
  created_at: string;
}

const storageKey = (modeId: string) => `notes_${modeId}`;

interface NotesSectionProps {
  modeId: string;
}

export default function NotesSection({ modeId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newBody, setNewBody] = useState("");

  const load = () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey(modeId));
    setNotes(raw ? (JSON.parse(raw) as Note[]) : []);
  };

  const persist = (updated: Note[]) => {
    localStorage.setItem(storageKey(modeId), JSON.stringify(updated));
    setNotes(updated);
  };

  useEffect(load, [modeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => {
    if (!newBody.trim()) return;
    const note: Note = {
      id: crypto.randomUUID(),
      body: newBody.trim(),
      created_at: new Date().toISOString(),
    };
    persist([note, ...notes]);
    setNewBody("");
  };

  const del = (id: string) => persist(notes.filter((n) => n.id !== id));

  return (
    <div>
      <div className="mb-4">
        <textarea
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          placeholder="Write a note…"
          rows={3}
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
        />
        <button
          onClick={add}
          className="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add note
        </button>
      </div>

      {notes.length === 0 && (
        <p className="text-sm text-text-secondary">No notes yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {notes.map((n) => (
          <li key={n.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl group">
            <p className="flex-1 text-sm text-text-primary whitespace-pre-wrap">{n.body}</p>
            <button
              onClick={() => del(n.id)}
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
