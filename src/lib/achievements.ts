/**
 * Achievement checking logic.
 * Called after every XP award to see if the user has earned new achievements.
 */

import { db, makeRecord, type DbAchievement } from "@/db/db";
import { triggerAchievementToast } from "@/components/ui/AchievementToast";

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  check: (userId: string) => Promise<boolean>;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_step",
    name: "First Step",
    description: "Complete onboarding",
    icon: "🚀",
    xp: 50,
    check: async (userId) => {
      const user = await db.users.get(userId);
      return !!user?.onboarding_complete;
    },
  },
  {
    id: "task_starter",
    name: "Task Starter",
    description: "Complete your first task",
    icon: "✅",
    xp: 10,
    check: async (userId) => {
      const count = await db.tasks
        .filter((t) => t.user_id === userId && t.completed && !t.is_deleted)
        .count();
      return count >= 1;
    },
  },
  {
    id: "task_master_5",
    name: "Task Master",
    description: "Complete 5 tasks",
    icon: "🎯",
    xp: 30,
    check: async (userId) => {
      const count = await db.tasks
        .filter((t) => t.user_id === userId && t.completed && !t.is_deleted)
        .count();
      return count >= 5;
    },
  },
  {
    id: "pomodoro_pro_50",
    name: "Pomodoro Pro",
    description: "Complete 50 Pomodoro sessions",
    icon: "🍅",
    xp: 100,
    check: async (userId) => {
      const count = await db.pomodoro_sessions
        .filter((s) => s.user_id === userId && s.completed && !s.is_deleted)
        .count();
      return count >= 50;
    },
  },
  {
    id: "habit_builder",
    name: "Habit Builder",
    description: "Check in on a habit 7 days in a row",
    icon: "🔥",
    xp: 50,
    check: async (userId) => {
      const logs = await db.habit_logs
        .filter((l) => l.user_id === userId && !l.is_deleted)
        .toArray();
      if (logs.length < 7) return false;
      // Check for 7 consecutive days in any habit
      const dates = [...new Set(logs.map((l) => l.logged_date))].sort();
      let maxStreak = 1;
      let streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]!);
        const curr = new Date(dates[i]!);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      return maxStreak >= 7;
    },
  },
  {
    id: "goal_achiever",
    name: "Goal Achiever",
    description: "Complete your first goal",
    icon: "🏆",
    xp: 50,
    check: async (userId) => {
      const count = await db.personal_goals
        .filter((g) => g.user_id === userId && g.completed && !g.is_deleted)
        .count();
      return count >= 1;
    },
  },
  {
    id: "fitness_start",
    name: "Getting Fit",
    description: "Log your first workout",
    icon: "💪",
    xp: 20,
    check: async (userId) => {
      const count = await db.workout_logs
        .filter((l) => l.user_id === userId && !l.is_deleted)
        .count();
      return count >= 1;
    },
  },
  {
    id: "budget_master",
    name: "Budget Master",
    description: "Stay under budget for a full month",
    icon: "💰",
    xp: 100,
    check: async () => {
      // This requires external verification; skipped in auto-check
      return false;
    },
  },
];

/**
 * Check all achievement conditions for a user.
 * If an achievement is newly earned, write it to Dexie and trigger the toast.
 */
export async function checkAchievements(userId: string): Promise<void> {
  if (!db || !userId) return;
  try {
    const earned = await db.achievements
      .filter((a) => a.user_id === userId && !a.is_deleted)
      .toArray();
    // Note: DbAchievement.name stores the achievement definition ID (def.id),
    // not a display name. This allows de-duplication by logical ID.
    const earnedIds = new Set(earned.map((a) => a.name));

    for (const def of ACHIEVEMENTS) {
      if (earnedIds.has(def.id)) continue;
      const qualifies = await def.check(userId);
      if (!qualifies) continue;

      const achievement = makeRecord<DbAchievement>(
        {
          name: def.id,
          description: def.description,
          icon: def.icon,
          earned_at: new Date().toISOString(),
          xp: def.xp,
        },
        userId,
      );
      await db.achievements.add(achievement);
      triggerAchievementToast({
        id: achievement.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        xp: def.xp,
      });
    }
  } catch {
    // Silently ignore — achievements are non-critical
  }
}
