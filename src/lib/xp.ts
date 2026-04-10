/**
 * XP system — level thresholds, level-up logic, and per-action XP awards.
 */

// ─── Level thresholds ─────────────────────────────────────────────────────────

/**
 * XP required to reach each level (index = level number, 1-based).
 * Level 1 starts at 0 XP; level 2 requires 100 XP; etc.
 */
const LEVEL_THRESHOLDS: number[] = [
  0,      // level 1
  100,    // level 2
  250,    // level 3
  500,    // level 4
  850,    // level 5
  1300,   // level 6
  1900,   // level 7
  2700,   // level 8
  3700,   // level 9
  5000,   // level 10
];

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/**
 * Return the level (1-based) for a given total XP amount.
 */
export function levelFromXP(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]!) level = i + 1;
    else break;
  }
  return level;
}

/**
 * XP progress within the current level (0 → 1 float).
 */
export function levelProgress(xp: number): number {
  const level = levelFromXP(xp);
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!;
  if (next === current) return 1;
  return Math.min(1, (xp - current) / (next - current));
}

/**
 * XP until next level, or 0 if already at max.
 */
export function xpToNextLevel(xp: number): number {
  const level = levelFromXP(xp);
  if (level >= MAX_LEVEL) return 0;
  return (LEVEL_THRESHOLDS[level] ?? 0) - xp;
}

/**
 * Returns the XP threshold at the start of the current level and the next level,
 * useful for rendering a progress bar.
 */
export function xpThresholdsForLevel(xp: number): { levelStart: number; levelEnd: number } {
  const level = levelFromXP(xp);
  const levelStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const levelEnd = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!;
  return { levelStart, levelEnd };
}

// ─── Per-action XP awards ─────────────────────────────────────────────────────

export const XP_AWARDS = {
  // Timer / focus
  complete_focus_session: 25,
  complete_5_sessions: 50,
  complete_10_sessions: 100,

  // Tasks
  complete_task: 10,
  complete_5_tasks: 30,

  // Habits
  habit_check_in: 5,
  habit_7_day_streak: 50,
  habit_30_day_streak: 200,

  // Study
  log_study_session: 15,
  pass_exam: 100,

  // Financial
  log_expense: 5,
  meet_budget: 40,
  reach_savings_goal: 150,

  // Fitness
  log_workout: 20,
  fitness_7_day_streak: 60,

  // Professional
  complete_project: 80,
  close_meeting: 10,

  // General
  write_journal: 10,
  complete_goal: 50,

  // Onboarding
  complete_onboarding: 50,
} as const;

export type XPAction = keyof typeof XP_AWARDS;

/**
 * Calculate total XP from a list of completed actions.
 */
export function calculateXP(actions: XPAction[]): number {
  return actions.reduce((sum, action) => sum + (XP_AWARDS[action] ?? 0), 0);
}

// ─── Character stats ──────────────────────────────────────────────────────────

export type CharacterStat = "focus" | "drive" | "vitality" | "wealth" | "balance";

/**
 * Map from XP action to which character stat it increments.
 */
export const STAT_INCREMENTS: Record<XPAction, CharacterStat | null> = {
  complete_focus_session: "focus",
  complete_5_sessions: "focus",
  complete_10_sessions: "focus",
  complete_task: "drive",
  complete_5_tasks: "drive",
  habit_check_in: "balance",
  habit_7_day_streak: "balance",
  habit_30_day_streak: "balance",
  log_study_session: "focus",
  pass_exam: "focus",
  log_expense: "wealth",
  meet_budget: "wealth",
  reach_savings_goal: "wealth",
  log_workout: "vitality",
  fitness_7_day_streak: "vitality",
  complete_project: "drive",
  close_meeting: "drive",
  write_journal: "balance",
  complete_goal: "drive",
  complete_onboarding: null,
};
