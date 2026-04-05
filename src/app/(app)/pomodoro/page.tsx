"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, Settings, X, BookOpen, Briefcase, Dumbbell, DollarSign, LayoutGrid, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useTimer } from "@/contexts/TimerContext";
import { PomodoroSettings } from "@/types";

const TIMER_MODES = {
  focus: { label: "Focus", color: "text-primary" },
  shortBreak: { label: "Short Break", color: "text-success" },
  longBreak: { label: "Long Break", color: "text-blue-400" },
};

type TimerModeKey = keyof typeof TIMER_MODES;

const APP_MODES = [
  { id: "study", label: "Study", icon: BookOpen },
  { id: "professional", label: "Professional", icon: Briefcase },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "general", label: "General", icon: LayoutGrid },
];

export default function PomodoroPage() {
  const { state, startSession, pause, resume, reset, switchMode, updateSettings } = useTimer();

  const [showSettings, setShowSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<PomodoroSettings>(state.settings);

  // Session tagging (local UI state — passed into context on start)
  const [taggedMode, setTaggedMode] = useState<string>("study");
  const [taskTag, setTaskTag] = useState("");

  // Keep draftSettings in sync with context settings when not editing
  useEffect(() => {
    if (!showSettings) {
      setDraftSettings(state.settings);
    }
  }, [state.settings, showSettings]);

  const timerMode = state.mode as TimerModeKey;
  const timeLeft = state.timeRemaining;
  const running = state.status === "running";

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const totalDuration = state.totalTime;
  const progress = totalDuration > 0 ? 1 - timeLeft / totalDuration : 0;

  const handlePlayPause = () => {
    if (state.status === "idle") {
      startSession(taggedMode, taskTag);
    } else if (state.status === "running") {
      pause();
    } else {
      resume();
    }
  };

  const handleSaveSettings = () => {
    updateSettings(draftSettings);
    setShowSettings(false);
  };

  return (
    <div className="max-w-lg mx-auto pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Pomodoro Timer</h1>
        <button
          onClick={() => { setDraftSettings(state.settings); setShowSettings(true); }}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-card rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-text-primary">Timer Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <Input
                label="Focus duration (minutes)"
                type="number"
                min={1} max={120}
                value={draftSettings.focusDuration}
                onChange={(e) => setDraftSettings({ ...draftSettings, focusDuration: Number(e.target.value) })}
              />
              <Input
                label="Short break (minutes)"
                type="number"
                min={1} max={30}
                value={draftSettings.shortBreakDuration}
                onChange={(e) => setDraftSettings({ ...draftSettings, shortBreakDuration: Number(e.target.value) })}
              />
              <Input
                label="Long break (minutes)"
                type="number"
                min={1} max={60}
                value={draftSettings.longBreakDuration}
                onChange={(e) => setDraftSettings({ ...draftSettings, longBreakDuration: Number(e.target.value) })}
              />
              <Input
                label="Cycles before long break"
                type="number"
                min={1} max={10}
                value={draftSettings.cyclesBeforeLongBreak}
                onChange={(e) => setDraftSettings({ ...draftSettings, cyclesBeforeLongBreak: Number(e.target.value) })}
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary"
                  checked={draftSettings.soundEnabled}
                  onChange={(e) => setDraftSettings({ ...draftSettings, soundEnabled: e.target.checked })}
                />
                <span className="text-sm text-text-primary">Sound notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary"
                  checked={draftSettings.notificationsEnabled}
                  onChange={(e) => setDraftSettings({ ...draftSettings, notificationsEnabled: e.target.checked })}
                />
                <span className="text-sm text-text-primary">Browser notifications</span>
              </label>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowSettings(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSaveSettings} className="flex-1">Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex bg-card border border-border rounded-xl p-1 mb-6">
        {(Object.keys(TIMER_MODES) as TimerModeKey[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              "flex-1 py-2 text-sm rounded-lg transition-colors duration-200 font-medium",
              timerMode === m ? "bg-background text-text-primary" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {TIMER_MODES[m].label}
          </button>
        ))}
      </div>

      {/* Session tagging */}
      <div className="mb-6 p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-text-secondary" />
          <p className="text-sm font-medium text-text-secondary">Tag this session</p>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {APP_MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setTaggedMode(m.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  taggedMode === m.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-text-secondary hover:text-text-primary"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Optional: task, subject, or project name"
          value={taskTag}
          onChange={(e) => setTaskTag(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Timer circle */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-56 h-56">
          <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a2a" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={timerMode === "focus" ? "#6366f1" : timerMode === "shortBreak" ? "#22c55e" : "#60a5fa"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 283} 283`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-text-primary font-mono">
              {minutes}:{seconds}
            </span>
            <span className={cn("text-sm mt-1 font-medium", TIMER_MODES[timerMode].color)}>
              {TIMER_MODES[timerMode].label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={reset}
          className="p-3 text-text-secondary hover:text-text-primary hover:bg-card rounded-xl transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={handlePlayPause}
          className="w-14 h-14 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center transition-colors"
        >
          {running ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
        </button>
        <div className="p-3">
          {timerMode === "focus" ? (
            <Brain className="w-5 h-5 text-primary" />
          ) : (
            <Coffee className="w-5 h-5 text-success" />
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="text-center">
        <p className="text-text-secondary text-sm">
          Cycle {state.cycleCount + 1} of {state.settings.cyclesBeforeLongBreak} · {state.sessionCount} sessions today
        </p>
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: state.settings.cyclesBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full",
                i < state.cycleCount ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

