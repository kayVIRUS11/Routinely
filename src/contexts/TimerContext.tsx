"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { TimerState, TimerMode, TimerStatus, PomodoroSettings } from "@/types";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  saveSession,
  getDurationSeconds,
} from "@/lib/pomodoro";
import { triggerAchievementToast } from "@/components/ui/AchievementToast";

// ─── Persistence ────────────────────────────────────────────────────────────

const PERSIST_KEY = "pomodoro_timer_state";

function readPersistedState(): TimerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? (JSON.parse(raw) as TimerState) : null;
  } catch {
    return null;
  }
}

function persistState(state: TimerState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ─── Initial state ───────────────────────────────────────────────────────────

function buildInitialState(settings: PomodoroSettings): TimerState {
  const totalTime = getDurationSeconds("focus", settings);
  return {
    status: "idle" as TimerStatus,
    mode: "focus" as TimerMode,
    timeRemaining: totalTime,
    totalTime,
    timeAtStart: null,
    sessionModeId: "study",
    taskName: "",
    startedAt: null,
    cycleCount: 0,
    sessionCount: 0,
    settings,
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "HYDRATE"; state: TimerState }
  | { type: "START"; modeId: string; taskName: string }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK"; timeRemaining: number }
  | { type: "RESET" }
  | { type: "SWITCH_MODE"; mode: TimerMode }
  | { type: "COMPLETE_FOCUS"; newMode: TimerMode; newCycleCount: number }
  | { type: "COMPLETE_BREAK" }
  | { type: "UPDATE_SETTINGS"; settings: PomodoroSettings };

function reducer(state: TimerState, action: Action): TimerState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "START": {
      const totalTime = getDurationSeconds(state.mode, state.settings);
      return {
        ...state,
        status: "running",
        timeRemaining: totalTime,
        totalTime,
        timeAtStart: totalTime,
        sessionModeId: action.modeId,
        taskName: action.taskName,
        startedAt: Date.now(),
      };
    }

    case "PAUSE":
      return { ...state, status: "paused", startedAt: null, timeAtStart: null };

    case "RESUME":
      return {
        ...state,
        status: "running",
        startedAt: Date.now(),
        timeAtStart: state.timeRemaining,
      };

    case "TICK":
      return { ...state, timeRemaining: action.timeRemaining };

    case "RESET": {
      const totalTime = getDurationSeconds(state.mode, state.settings);
      return {
        ...state,
        status: "idle",
        timeRemaining: totalTime,
        totalTime,
        startedAt: null,
        timeAtStart: null,
      };
    }

    case "SWITCH_MODE": {
      const totalTime = getDurationSeconds(action.mode, state.settings);
      return {
        ...state,
        status: "idle",
        mode: action.mode,
        timeRemaining: totalTime,
        totalTime,
        startedAt: null,
        timeAtStart: null,
      };
    }

    case "COMPLETE_FOCUS": {
      const totalTime = getDurationSeconds(action.newMode, state.settings);
      return {
        ...state,
        status: "idle",
        mode: action.newMode,
        timeRemaining: totalTime,
        totalTime,
        cycleCount: action.newCycleCount,
        sessionCount: state.sessionCount + 1,
        startedAt: null,
        timeAtStart: null,
      };
    }

    case "COMPLETE_BREAK": {
      const totalTime = getDurationSeconds("focus", state.settings);
      return {
        ...state,
        status: "idle",
        mode: "focus",
        timeRemaining: totalTime,
        totalTime,
        startedAt: null,
        timeAtStart: null,
      };
    }

    case "UPDATE_SETTINGS": {
      const newSettings = action.settings;
      const shouldUpdateTime = state.status === "idle";
      const newTotal = shouldUpdateTime
        ? getDurationSeconds(state.mode, newSettings)
        : state.totalTime;
      return {
        ...state,
        settings: newSettings,
        ...(shouldUpdateTime ? { timeRemaining: newTotal, totalTime: newTotal } : {}),
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface TimerContextValue {
  state: TimerState;
  startSession: (modeId: string, taskName: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  switchMode: (mode: TimerMode) => void;
  updateSettings: (settings: PomodoroSettings) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within a TimerProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    buildInitialState(DEFAULT_SETTINGS),
  );

  // Keep a ref so interval callbacks always see the latest state without
  // needing to be recreated on every render.
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Hydration: browser-close recovery ──────────────────────────────────────
  useEffect(() => {
    const settings = loadSettings();
    const saved = readPersistedState();

    if (!saved) {
      dispatch({ type: "HYDRATE", state: buildInitialState(settings) });
      return;
    }

    if (saved.status === "running" && saved.startedAt !== null && saved.timeAtStart !== null) {
      const elapsed = Math.min((Date.now() - saved.startedAt) / 1000, saved.timeAtStart);
      const newTimeRemaining = Math.max(0, Math.round(saved.timeAtStart - elapsed));

      if (newTimeRemaining > 0) {
        // Timer was running and still has time left — re-anchor to now.
        dispatch({
          type: "HYDRATE",
          state: {
            ...saved,
            settings,
            timeRemaining: newTimeRemaining,
            startedAt: Date.now(),
            timeAtStart: newTimeRemaining,
          },
        });
      } else {
        // Timer would have finished while the browser was closed — log it and
        // move to the appropriate break.
        if (saved.mode === "focus") {
          saveSession(saved.sessionModeId, saved.taskName, saved.settings.focusDuration);
          const rawNewCycle = saved.cycleCount + 1;
          const nextMode: TimerMode =
            rawNewCycle >= saved.settings.cyclesBeforeLongBreak ? "longBreak" : "shortBreak";
          const newCycleCount = nextMode === "longBreak" ? 0 : rawNewCycle;
          const totalTime = getDurationSeconds(nextMode, settings);
          dispatch({
            type: "HYDRATE",
            state: {
              ...saved,
              settings,
              status: "idle",
              mode: nextMode,
              timeRemaining: totalTime,
              totalTime,
              cycleCount: newCycleCount,
              sessionCount: saved.sessionCount + 1,
              startedAt: null,
              timeAtStart: null,
            },
          });
        } else {
          // Break finished — return to idle focus.
          const totalTime = getDurationSeconds("focus", settings);
          dispatch({
            type: "HYDRATE",
            state: {
              ...saved,
              settings,
              status: "idle",
              mode: "focus",
              timeRemaining: totalTime,
              totalTime,
              startedAt: null,
              timeAtStart: null,
            },
          });
        }
      }
    } else {
      // Was paused or idle — restore as-is, just refresh settings.
      dispatch({ type: "HYDRATE", state: { ...saved, settings } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist on every state change (enables browser-close recovery) ─────────
  useEffect(() => {
    persistState(state);
  }, [state]);

  // ── Tick interval ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.status !== "running") return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.status !== "running" || s.startedAt === null || s.timeAtStart === null) return;

      const elapsed = Math.min((Date.now() - s.startedAt) / 1000, s.timeAtStart);
      const newTimeRemaining = Math.max(0, Math.round(s.timeAtStart - elapsed));

      if (newTimeRemaining <= 0) {
        if (s.mode === "focus") {
          saveSession(s.sessionModeId, s.taskName, s.settings.focusDuration);

          const rawNewCycle = s.cycleCount + 1;
          const nextMode: TimerMode =
            rawNewCycle >= s.settings.cyclesBeforeLongBreak ? "longBreak" : "shortBreak";
          const newCycleCount = nextMode === "longBreak" ? 0 : rawNewCycle;

          // Achievements
          const totalSessions = s.sessionCount + 1;
          if (totalSessions === 1) {
            triggerAchievementToast({
              id: "first_pomodoro",
              name: "First Pomodoro!",
              description: "Completed your first focus session.",
              icon: "🍅",
              xp: 25,
            });
          } else if (totalSessions === 5) {
            triggerAchievementToast({
              id: "five_pomodoros",
              name: "On a Roll!",
              description: "Completed 5 focus sessions.",
              icon: "🔥",
              xp: 50,
            });
          } else if (totalSessions === 10) {
            triggerAchievementToast({
              id: "ten_pomodoros",
              name: "Deep Focus Master",
              description: "10 focus sessions completed!",
              icon: "🧠",
              xp: 100,
            });
          }

          if (
            s.settings.notificationsEnabled &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Routinely", {
              body: "Focus session complete! Time for a break.",
            });
          }

          dispatch({ type: "COMPLETE_FOCUS", newMode: nextMode, newCycleCount });
        } else {
          if (
            s.settings.notificationsEnabled &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Routinely", { body: "Break over — back to focus!" });
          }
          dispatch({ type: "COMPLETE_BREAK" });
        }
      } else {
        dispatch({ type: "TICK", timeRemaining: newTimeRemaining });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status]);

  // ── Page Visibility API — catch up after tab switch ────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const s = stateRef.current;
      if (s.status === "running" && s.startedAt !== null && s.timeAtStart !== null) {
        const elapsed = Math.min((Date.now() - s.startedAt) / 1000, s.timeAtStart);
        const newTimeRemaining = Math.max(0, Math.round(s.timeAtStart - elapsed));
        dispatch({ type: "TICK", timeRemaining: newTimeRemaining });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const startSession = useCallback((modeId: string, taskName: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    dispatch({ type: "START", modeId, taskName });
  }, []);

  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const switchMode = useCallback(
    (mode: TimerMode) => dispatch({ type: "SWITCH_MODE", mode }),
    [],
  );
  const updateSettings = useCallback((settings: PomodoroSettings) => {
    saveSettings(settings);
    dispatch({ type: "UPDATE_SETTINGS", settings });
  }, []);

  return (
    <TimerContext.Provider
      value={{ state, startSession, pause, resume, reset, switchMode, updateSettings }}
    >
      {children}
    </TimerContext.Provider>
  );
}
