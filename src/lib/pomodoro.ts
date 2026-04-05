import { PomodoroSettings, TimerMode } from "@/types";

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
};

export function loadSettings(): PomodoroSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem("pomodoro_settings");
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PomodoroSettings>) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PomodoroSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pomodoro_settings", JSON.stringify(settings));
  } catch { /* ignore */ }
}

export function saveSession(
  modeId: string,
  taskTag: string,
  durationMinutes: number,
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(
      localStorage.getItem("pomodoro_sessions") ?? "[]",
    ) as { date: string; modeId: string; taskTag: string; durationMinutes: number }[];
    existing.push({ date: new Date().toISOString(), modeId, taskTag, durationMinutes });
    localStorage.setItem("pomodoro_sessions", JSON.stringify(existing));
  } catch { /* ignore */ }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function getDurationSeconds(mode: TimerMode, settings: PomodoroSettings): number {
  if (mode === "focus") return settings.focusDuration * 60;
  if (mode === "shortBreak") return settings.shortBreakDuration * 60;
  return settings.longBreakDuration * 60;
}
