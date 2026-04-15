/**
 * Stats & XP award functions.
 * Call awardXP() whenever the user completes an action worth XP.
 */

import { db } from "@/db/db";
import { levelFromXP } from "@/lib/xp";
import { checkAchievements } from "@/lib/achievements";

export type StatKey = "focus" | "drive" | "vitality" | "wealth" | "balance";

/**
 * Award XP to the user and update their level.
 * Also increments the relevant character stat.
 */
export async function awardXP(
  userId: string,
  stat: StatKey,
  amount: number,
): Promise<void> {
  if (!db || !userId) return;
  try {
    const user = await db.users.get(userId);
    if (!user) return;

    const currentXP = (user.xp ?? 0) + amount;
    const newLevel = levelFromXP(currentXP);

    const statField = `${stat}_stat` as `${StatKey}_stat`;
    const currentStatValue = (user as unknown as Record<string, number>)[statField] ?? 0;

    await db.users.update(userId, {
      xp: currentXP,
      level: newLevel,
      [statField]: currentStatValue + amount,
      updated_at: new Date().toISOString(),
    });

    // Check for newly earned achievements
    await checkAchievements(userId);
  } catch {
    // Silently ignore — XP is a nice-to-have, not critical
  }
}
