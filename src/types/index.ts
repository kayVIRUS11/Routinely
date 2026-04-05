export type ModeType = "study" | "professional" | "fitness" | "financial" | "general" | "custom";

export type TimerMode = "focus" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface TimerState {
  status: TimerStatus;
  mode: TimerMode;
  timeRemaining: number;
  totalTime: number;
  timeAtStart: number | null;
  sessionModeId: string;
  taskName: string;
  startedAt: number | null;
  cycleCount: number;
  sessionCount: number;
  settings: PomodoroSettings;
}

export interface Mode {
  id: string;
  modeType: ModeType;
  modeName: string;
  icon?: string;
  isActive: boolean;
  order: number;
  sections: Record<string, any>;
}

export interface StudyMetrics {
  tasksDue: number;
  hoursStudied: number;
  nextExam?: string;
  streak: number;
}

export interface FinancialMetrics {
  monthlySpend: number;
  budgetRemaining: number;
  nextBill?: string;
  savingsPercent: number;
}

export interface FitnessMetrics {
  streak: number;
  todaysWorkout?: string;
  lastSession?: string;
}

export interface ProfessionalMetrics {
  deadlines: number;
  tasksInProgress: number;
  nextMeeting?: string;
}

export interface GeneralMetrics {
  goals: number;
  habitStreaks: number;
  todaysTasks: number;
  lastJournal?: string;
}

export interface RoutineItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  modeId?: string;
  dayOfWeek: number[];
}

export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  image?: string;
  characterName?: string;
  characterLevel: number;
  xp: number;
  onboardingComplete: boolean;
  isGuest: boolean;
}
