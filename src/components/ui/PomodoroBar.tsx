"use client";

import { Pause, Play, X, Coffee, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/pomodoro";
import { useTimer } from "@/contexts/TimerContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function PomodoroBar() {
  const { state, pause, resume, reset } = useTimer();
  const isMobile = useMediaQuery("(max-width: 640px)");

  if (state.status === "idle") return null;

  const isFocus = state.mode === "focus";
  const isRunning = state.status === "running";
  const progress = state.totalTime > 0 ? (state.totalTime - state.timeRemaining) / state.totalTime : 0;
  const timeDisplay = formatTime(state.timeRemaining);
  const modeLabel =
    isFocus ? "Focus" : state.mode === "shortBreak" ? "Short Break" : "Long Break";
  const ModeIcon = isFocus ? Brain : Coffee;

  // ── Mobile: floating pill ─────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl",
          "border backdrop-blur-md transition-colors duration-500",
          isFocus
            ? "bg-indigo-950/90 border-indigo-700/50"
            : "bg-green-950/90 border-green-700/50",
        )}
      >
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isFocus ? "text-indigo-300" : "text-green-300",
          )}
        >
          <ModeIcon className="w-3.5 h-3.5" />
          {modeLabel}
        </span>
        <span className="text-sm font-bold text-white font-mono">{timeDisplay}</span>
        <button
          onClick={isRunning ? pause : resume}
          aria-label={isRunning ? "Pause" : "Resume"}
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
            isFocus
              ? "bg-indigo-600 hover:bg-indigo-500"
              : "bg-green-600 hover:bg-green-500",
          )}
        >
          {isRunning ? (
            <Pause className="w-3 h-3 text-white" />
          ) : (
            <Play className="w-3 h-3 text-white ml-0.5" />
          )}
        </button>
        <button
          onClick={reset}
          aria-label="Stop session"
          className="text-white/50 hover:text-white/80 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── Desktop: fixed top bar ────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "fixed top-0 left-[52px] right-0 z-40 h-10",
        "flex items-center px-4 gap-3",
        "backdrop-blur-md border-b transition-colors duration-500",
        isFocus
          ? "bg-indigo-950/90 border-indigo-800/40"
          : "bg-green-950/90 border-green-800/40",
      )}
    >
      {/* Progress line along bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className={cn(
            "h-full transition-all duration-1000",
            isFocus ? "bg-indigo-400" : "bg-green-400",
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Mode badge */}
      <span
        className={cn(
          "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0",
          isFocus
            ? "text-indigo-300 border-indigo-600/50 bg-indigo-900/50"
            : "text-green-300 border-green-600/50 bg-green-900/50",
        )}
      >
        <ModeIcon className="w-3.5 h-3.5" />
        {modeLabel}
      </span>

      {/* Task / mode label */}
      <span className="text-xs text-white/60 truncate flex-1">
        {state.sessionModeId && (
          <span className="capitalize">{state.sessionModeId}</span>
        )}
        {state.taskName && state.sessionModeId && " · "}
        {state.taskName}
      </span>

      {/* Countdown */}
      <span className="text-sm font-bold text-white font-mono shrink-0">{timeDisplay}</span>

      {/* Controls */}
      <button
        onClick={isRunning ? pause : resume}
        aria-label={isRunning ? "Pause" : "Resume"}
        className="p-1 text-white/60 hover:text-white transition-colors"
      >
        {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button
        onClick={reset}
        aria-label="Stop session"
        className="p-1 text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
