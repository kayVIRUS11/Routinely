"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import QuickAddModal from "./QuickAddModal";

export default function QuickAddButton() {
  const [open, setOpen] = useState(false);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add task (Ctrl+K)"
        title="Quick add task (Ctrl+K)"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
      {open && <QuickAddModal onClose={() => setOpen(false)} />}
    </>
  );
}
