"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = {
  focus: { label: "Focus", duration: 25 * 60, color: "text-primary" },
  shortBreak: { label: "Short Break", duration: 5 * 60, color: "text-success" },
  longBreak: { label: "Long Break", duration: 15 * 60, color: "text-blue-400" },
};

type ModeKey = keyof typeof MODES;

export default function PomodoroPage() {
  const [mode, setMode] = useState<ModeKey>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const reset = useCallback(() => {
    setRunning(false);
    setTimeLeft(MODES[mode].duration);
  }, [mode]);

  useEffect(() => {
    reset();
  }, [mode, reset]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          if (mode === "focus") setSessions((s) => s + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, mode]);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const progress = 1 - timeLeft / MODES[mode].duration;

  return (
    <div className="max-w-md mx-auto pt-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6 text-center">Pomodoro Timer</h1>

      <div className="flex bg-card border border-border rounded-xl p-1 mb-10">
        {(Object.keys(MODES) as ModeKey[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2 text-sm rounded-lg transition-colors duration-200 font-medium",
              mode === m ? "bg-background text-text-primary" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center mb-10">
        <div className="relative w-56 h-56">
          <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a2a" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={mode === "focus" ? "#6366f1" : mode === "shortBreak" ? "#22c55e" : "#60a5fa"}
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
            <span className={cn("text-sm mt-1 font-medium", MODES[mode].color)}>
              {MODES[mode].label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={reset}
          className="p-3 text-text-secondary hover:text-text-primary hover:bg-card rounded-xl transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => setRunning(!running)}
          className="w-14 h-14 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center transition-colors"
        >
          {running ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
        </button>
        <div className="p-3">
          {mode === "focus" ? (
            <Brain className="w-5 h-5 text-primary" />
          ) : (
            <Coffee className="w-5 h-5 text-success" />
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-text-secondary text-sm">Sessions completed today</p>
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: Math.max(4, sessions) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full",
                i < sessions ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
        <p className="text-text-primary font-medium mt-1">{sessions} / 4</p>
      </div>
    </div>
  );
}
