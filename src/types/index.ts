export type ModeType = "study" | "professional" | "fitness" | "financial" | "general" | "custom";

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
