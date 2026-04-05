import Dexie, { type Table } from "dexie";

// ─── Shared base fields ───────────────────────────────────────────────────────

interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  user_id: string | null;
  is_deleted: boolean;
}

// ─── Core tables ─────────────────────────────────────────────────────────────

export interface DbMode extends BaseRecord {
  name: string;
  mode_type: string;
  icon: string | null;
  is_active: boolean;
  order: number;
  sections: string[]; // JSON-serialisable array stored as-is by Dexie
}

export interface DbTask extends BaseRecord {
  mode_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  is_recurring: boolean;
}

export interface DbRoutine extends BaseRecord {
  mode_id: string | null;
  title: string;
  description: string | null;
  day_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface DbHabit extends BaseRecord {
  mode_id: string | null;
  title: string;
  description: string | null;
  frequency: "daily" | "weekly";
  target_count: number;
}

export interface DbHabitLog extends BaseRecord {
  habit_id: string;
  logged_date: string; // ISO date string YYYY-MM-DD
  count: number;
}

export interface DbPomodoroSession extends BaseRecord {
  mode_id: string | null;
  task_name: string;
  duration_minutes: number;
  completed: boolean;
  started_at: string;
  ended_at: string | null;
}

// ─── Study mode tables ────────────────────────────────────────────────────────

export interface DbSubject extends BaseRecord {
  name: string;
  color: string | null;
}

export interface DbTimetableEntry extends BaseRecord {
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
}

export interface DbExam extends BaseRecord {
  subject_id: string;
  title: string;
  exam_date: string;
  notes: string | null;
}

export interface DbStudySession extends BaseRecord {
  subject_id: string | null;
  task_name: string | null;
  duration_minutes: number;
  session_date: string;
}

export interface DbAssignment extends BaseRecord {
  subject_id: string | null;
  title: string;
  due_date: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

// ─── Financial mode tables ────────────────────────────────────────────────────

export interface DbIncomeEntry extends BaseRecord {
  title: string;
  amount: number;
  date: string;
  category: string | null;
}

export interface DbExpenseEntry extends BaseRecord {
  title: string;
  amount: number;
  date: string;
  category: string | null;
  budget_id: string | null;
}

export interface DbBudget extends BaseRecord {
  category: string;
  limit_amount: number;
  period: "monthly" | "weekly";
}

export interface DbSavingsGoal extends BaseRecord {
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
}

export interface DbBill extends BaseRecord {
  title: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  recurring: boolean;
}

// ─── Fitness mode tables ──────────────────────────────────────────────────────

export interface DbWorkoutPlan extends BaseRecord {
  title: string;
  scheduled_date: string | null;
  day_of_week: number | null;
  exercises: string; // JSON string
}

export interface DbWorkoutLog extends BaseRecord {
  plan_id: string | null;
  title: string;
  log_date: string;
  duration_minutes: number | null;
  notes: string | null;
}

export interface DbBodyMetric extends BaseRecord {
  metric_type: string;
  value: number;
  unit: string;
  recorded_date: string;
}

// ─── Professional mode tables ─────────────────────────────────────────────────

export interface DbProject extends BaseRecord {
  title: string;
  description: string | null;
  status: "active" | "completed" | "on_hold";
  deadline: string | null;
}

export interface DbMeetingLog extends BaseRecord {
  project_id: string | null;
  title: string;
  meeting_date: string;
  notes: string | null;
}

// ─── General mode tables ──────────────────────────────────────────────────────

export interface DbPersonalGoal extends BaseRecord {
  title: string;
  description: string | null;
  target_date: string | null;
  completed: boolean;
}

export interface DbJournalEntry extends BaseRecord {
  title: string | null;
  body: string;
  entry_date: string;
  mood: string | null;
}

// ─── RPG & gamification tables ────────────────────────────────────────────────

export interface DbAchievement extends BaseRecord {
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  xp: number;
}

export interface DbSkillUnlock extends BaseRecord {
  skill_name: string;
  mode_id: string | null;
  level: number;
  unlocked_at: string;
}

// ─── Sync queue ───────────────────────────────────────────────────────────────

export interface DbSyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: "create" | "update" | "delete";
  payload: string; // JSON string
  queued_at: string;
  attempts: number;
}

// ─── Database class ───────────────────────────────────────────────────────────

class RoutinelyDB extends Dexie {
  // Core
  modes!: Table<DbMode>;
  tasks!: Table<DbTask>;
  routines!: Table<DbRoutine>;
  habits!: Table<DbHabit>;
  habit_logs!: Table<DbHabitLog>;
  pomodoro_sessions!: Table<DbPomodoroSession>;

  // Study
  subjects!: Table<DbSubject>;
  timetable_entries!: Table<DbTimetableEntry>;
  exams!: Table<DbExam>;
  study_sessions!: Table<DbStudySession>;
  assignments!: Table<DbAssignment>;

  // Financial
  income_entries!: Table<DbIncomeEntry>;
  expense_entries!: Table<DbExpenseEntry>;
  budgets!: Table<DbBudget>;
  savings_goals!: Table<DbSavingsGoal>;
  bills!: Table<DbBill>;

  // Fitness
  workout_plans!: Table<DbWorkoutPlan>;
  workout_logs!: Table<DbWorkoutLog>;
  body_metrics!: Table<DbBodyMetric>;

  // Professional
  projects!: Table<DbProject>;
  meeting_logs!: Table<DbMeetingLog>;

  // General
  personal_goals!: Table<DbPersonalGoal>;
  journal_entries!: Table<DbJournalEntry>;

  // RPG
  achievements!: Table<DbAchievement>;
  skill_unlocks!: Table<DbSkillUnlock>;

  // Sync
  sync_queue!: Table<DbSyncQueueItem>;

  constructor() {
    super("RoutinelyDB");

    this.version(1).stores({
      // Core
      modes: "id, user_id, is_deleted, mode_type",
      tasks: "id, user_id, mode_id, is_deleted, due_date, completed",
      routines: "id, user_id, mode_id, is_deleted",
      habits: "id, user_id, mode_id, is_deleted",
      habit_logs: "id, user_id, habit_id, logged_date, is_deleted",
      pomodoro_sessions: "id, user_id, mode_id, is_deleted, started_at",

      // Study
      subjects: "id, user_id, is_deleted",
      timetable_entries: "id, user_id, subject_id, is_deleted",
      exams: "id, user_id, subject_id, is_deleted, exam_date",
      study_sessions: "id, user_id, subject_id, is_deleted, session_date",
      assignments: "id, user_id, subject_id, is_deleted, due_date, completed",

      // Financial
      income_entries: "id, user_id, is_deleted, date",
      expense_entries: "id, user_id, is_deleted, date, budget_id",
      budgets: "id, user_id, is_deleted",
      savings_goals: "id, user_id, is_deleted",
      bills: "id, user_id, is_deleted, due_date, is_paid",

      // Fitness
      workout_plans: "id, user_id, is_deleted, scheduled_date",
      workout_logs: "id, user_id, is_deleted, log_date, plan_id",
      body_metrics: "id, user_id, is_deleted, recorded_date",

      // Professional
      projects: "id, user_id, is_deleted, deadline",
      meeting_logs: "id, user_id, is_deleted, project_id, meeting_date",

      // General
      personal_goals: "id, user_id, is_deleted, completed",
      journal_entries: "id, user_id, is_deleted, entry_date",

      // RPG
      achievements: "id, user_id, is_deleted, earned_at",
      skill_unlocks: "id, user_id, is_deleted, mode_id",

      // Sync
      sync_queue: "id, table_name, record_id, queued_at",
    });
  }
}

export const db = new RoutinelyDB();

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function makeRecord<T extends BaseRecord>(
  partial: Omit<T, keyof BaseRecord> & Partial<BaseRecord>,
  userId: string | null = null,
): T {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    synced_at: null,
    user_id: userId,
    is_deleted: false,
    ...partial,
  } as T;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}
