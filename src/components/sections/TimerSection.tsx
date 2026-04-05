"use client";

import { useTimer } from "@/contexts/TimerContext";
import { formatTime } from "@/lib/pomodoro";
import { Play, Pause, RotateCcw, Brain, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerSectionProps {
  modeId: string;
}

export default function TimerSection({ modeId }: TimerSectionProps) {
  const { state, startSession, pause, resume, reset } = useTimer();
  const isThisMode = state.sessionModeId === modeId;
  const isFocus = state.mode === "focus";
  const isRunning = state.status === "running";
  const isActive = state.status !== "idle" && isThisMode;

  const progress =
    state.totalTime > 0
      ? (state.totalTime - state.timeRemaining) / state.totalTime
      : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Mode label */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
          isFocus
            ? "text-indigo-300 border-indigo-600/40 bg-indigo-900/30"
            : "text-green-300 border-green-600/40 bg-green-900/30",
        )}
      >
        {isFocus ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
        {isFocus ? "Focus" : state.mode === "shortBreak" ? "Short Break" : "Long Break"}
      </div>

      {/* Circular progress ring */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            stroke="currentColor" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
            className={cn(
              "transition-all duration-1000",
              isFocus ? "text-indigo-400" : "text-green-400",
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold font-mono text-text-primary">
            {formatTime(isThisMode ? state.timeRemaining : state.settings.focusDuration * 60)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isActive ? (
          <button
            onClick={() => startSession(modeId, "")}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Focus
          </button>
        ) : (
          <>
            <button
              onClick={isRunning ? pause : resume}
              className="p-3 bg-card border border-border rounded-xl text-text-primary hover:bg-card/80 transition-colors"
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={reset}
              className="p-3 bg-card border border-border rounded-xl text-text-secondary hover:text-text-primary transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {isActive && (
        <p className="text-xs text-text-secondary">
          Session: <span className="text-text-primary font-medium capitalize">{state.sessionModeId}</span>
          {state.taskName && <> · {state.taskName}</>}
        </p>
      )}
    </div>
  );
}
