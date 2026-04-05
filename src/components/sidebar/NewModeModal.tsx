"use client";

import { useState } from "react";
import { X, Check, Sparkles, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { triggerAchievementToast } from "@/components/ui/AchievementToast";
import IconPicker from "@/components/icons/IconPicker";
import { ModeIcon, type IconKey } from "@/components/icons/icons";

const DEFAULT_ICON: IconKey = "star";

const SECTION_OPTIONS = [
  { id: "tasks", label: "Tasks" },
  { id: "habits", label: "Habits" },
  { id: "routine", label: "Routine" },
  { id: "notes", label: "Notes" },
  { id: "timer", label: "Timer" },
  { id: "tracker", label: "Tracker" },
  { id: "goals", label: "Goals" },
  { id: "log", label: "Log" },
];

export interface CustomMode {
  id: string;
  name: string;
  /** SVG icon key from the icon library */
  icon: string;
  sections: string[];
  aiAchievements?: { name: string; description: string }[];
}

interface NewModeModalProps {
  onClose: () => void;
  onCreated: (mode: CustomMode) => void;
}

export default function NewModeModal({ onClose, onCreated }: NewModeModalProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<IconKey>(DEFAULT_ICON);
  const [selectedSections, setSelectedSections] = useState<string[]>(["tasks", "routine"]);
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(false);

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setAiStep(true);

    let aiAchievements: { name: string; description: string }[] = [];

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "achievements",
          modeName: name,
          sections: selectedSections,
          guest: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text: string = data.response ?? "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiAchievements = JSON.parse(jsonMatch[0]) as { name: string; description: string }[];
        }
      }
    } catch {
      // Fall back to default achievements
      aiAchievements = [
        { name: "First Step", description: `Started your ${name} journey` },
        { name: "Consistent Learner", description: `Maintained a 7-day streak in ${name}` },
        { name: "Dedicated", description: `Completed 30 sessions in ${name}` },
        { name: "Master", description: `Reached expert level in ${name}` },
      ];
    }

    setLoading(false);

    const newMode: CustomMode = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      icon: selectedIcon,
      sections: selectedSections,
      aiAchievements,
    };

    // Persist to localStorage
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("custom_modes") ?? "[]") as CustomMode[];
      existing.push(newMode);
      localStorage.setItem("custom_modes", JSON.stringify(existing));
    }

    onCreated(newMode);

    // Fire achievement toast
    triggerAchievementToast({
      id: `mode_created_${newMode.id}`,
      name: "Creator",
      description: `You created the "${name}" mode!`,
      icon: "⭐",
      xp: 25,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Create a new mode</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {aiStep && loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-text-secondary text-sm text-center">
              Gemini AI is generating your custom achievements and skill tree&hellip;
            </p>
          </div>
        ) : (
          <>
            {/* Mode name */}
            <div className="mb-5">
              <Input
                label="Mode name"
                placeholder="e.g. Arabic Learning, Side Project, Spiritual Practice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Icon picker */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm text-text-secondary font-medium">Choose an icon</p>
                {/* Preview of selected icon */}
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ModeIcon iconKey={selectedIcon} className="w-4 h-4 text-primary" />
                </div>
              </div>
              <IconPicker value={selectedIcon} onChange={setSelectedIcon} />
            </div>

            {/* Sections picker */}
            <div className="mb-6">
              <p className="text-sm text-text-secondary font-medium mb-2">
                Enable sections
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SECTION_OPTIONS.map((sec) => {
                  const on = selectedSections.includes(sec.id);
                  return (
                    <button
                      key={sec.id}
                      onClick={() => toggleSection(sec.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                        on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {on && <Check className="w-3.5 h-3.5" />}
                      {sec.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI note */}
            <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/15 rounded-xl mb-6">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-text-secondary">
                Gemini AI will automatically generate a custom achievement system and skill tree
                tailored to your mode after creation.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || selectedSections.length === 0}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4" />
                Create mode
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
