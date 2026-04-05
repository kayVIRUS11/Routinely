"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ModeIcon } from "@/components/icons/icons";
import type { CustomMode } from "@/components/sidebar/NewModeModal";
import TasksSection from "@/components/sections/TasksSection";
import HabitsSection from "@/components/sections/HabitsSection";
import RoutineSection from "@/components/sections/RoutineSection";
import NotesSection from "@/components/sections/NotesSection";
import TimerSection from "@/components/sections/TimerSection";
import TrackerSection from "@/components/sections/TrackerSection";
import GoalsSection from "@/components/sections/GoalsSection";
import LogSection from "@/components/sections/LogSection";

const SECTION_LABELS: Record<string, string> = {
  tasks: "Tasks",
  habits: "Habits",
  routine: "Routine",
  notes: "Notes",
  timer: "Timer",
  tracker: "Tracker",
  goals: "Goals",
  log: "Log",
};

function SectionComponent({ sectionId, modeId }: { sectionId: string; modeId: string }) {
  switch (sectionId) {
    case "tasks":
      return <TasksSection modeId={modeId} />;
    case "habits":
      return <HabitsSection modeId={modeId} />;
    case "routine":
      return <RoutineSection modeId={modeId} />;
    case "notes":
      return <NotesSection modeId={modeId} />;
    case "timer":
      return <TimerSection modeId={modeId} />;
    case "tracker":
      return <TrackerSection modeId={modeId} />;
    case "goals":
      return <GoalsSection modeId={modeId} />;
    case "log":
      return <LogSection modeId={modeId} />;
    default:
      return null;
  }
}

export default function CustomModePage() {
  const params = useParams<{ modeId: string }>();
  const modeId = params?.modeId ?? "";
  const [mode, setMode] = useState<CustomMode | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !modeId) return;
    const stored = localStorage.getItem("custom_modes");
    if (!stored) return;
    const modes = JSON.parse(stored) as CustomMode[];
    const found = modes.find((m) => m.id === modeId) ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(found);
    if (found && found.sections.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSection(found.sections[0]!);
    }
  }, [modeId]);

  if (!mode) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Mode not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <ModeIcon iconKey={mode.icon} className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{mode.name}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {mode.sections.length} section{mode.sections.length !== 1 ? "s" : ""} enabled
          </p>
        </div>
      </div>

      {/* Section tabs */}
      {mode.sections.length > 1 && (
        <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 flex-wrap">
          {mode.sections.map((sectionId) => (
            <button
              key={sectionId}
              onClick={() => setActiveSection(sectionId)}
              className={[
                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeSection === sectionId
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              {SECTION_LABELS[sectionId] ?? sectionId}
            </button>
          ))}
        </div>
      )}

      {/* Active section content */}
      {activeSection && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            {SECTION_LABELS[activeSection] ?? activeSection}
          </h2>
          <SectionComponent sectionId={activeSection} modeId={modeId} />
        </div>
      )}

      {/* AI achievements */}
      {mode.aiAchievements && mode.aiAchievements.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold text-text-primary mb-4">Achievements</h2>
          <ul className="flex flex-col gap-3">
            {mode.aiAchievements.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <ModeIcon iconKey={mode.icon} className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.name}</p>
                  <p className="text-xs text-text-secondary">{a.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
