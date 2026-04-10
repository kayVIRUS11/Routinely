/**
 * Clears all user data from Dexie and relevant localStorage keys.
 * Called when a user deletes their account or resets their data.
 */

import { db } from "@/db/db";

const SETTINGS_KEYS = [
  "settings_modes",
  "settings_appearance",
  "settings_notifications",
  "settings_account",
  "routinely_timer_state",
  "routinely_last_pull_timestamp",
  "custom_modes",
  "onboarding_characterName",
  "profile_avatarColor",
  "routinely_user_id",
  "theme",
];

export async function clearUserData(userId: string | null): Promise<void> {
  if (typeof window === "undefined") return;

  // Clear all Dexie data for this user
  for (const table of db.tables) {
    if (table.name === "sync_queue") continue;
    try {
      if (userId) {
        await table.where("user_id").equals(userId).delete();
      } else {
        // Guest — delete all records with null user_id
        await table.filter((r) => (r as { user_id: string | null }).user_id === null).delete();
      }
    } catch {
      // Some tables may not have user_id index — skip
    }
  }

  // Clear sync queue entirely for this user
  try {
    await db.sync_queue.clear();
  } catch { /* ignore */ }

  // Clear localStorage settings keys
  for (const key of SETTINGS_KEYS) {
    localStorage.removeItem(key);
  }
}
