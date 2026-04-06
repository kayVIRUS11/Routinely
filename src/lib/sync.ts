/**
 * Sync engine — push local Dexie changes to Supabase / backend, pull remote changes.
 *
 * Rules:
 * - Runs every 30 s when online, and immediately when the app comes back online.
 * - Guest users (user_id === null) are never synced.
 * - Soft-delete only: is_deleted = true until the server confirms deletion.
 * - On sign-up, all guest records are tagged with the new user_id and pushed.
 */

import { db } from "@/db/db";

const SYNC_INTERVAL_MS = 30_000;
const LAST_PULL_KEY = "routinely_last_pull_timestamp";

let syncTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLastPullTimestamp(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_PULL_KEY);
}

function setLastPullTimestamp(ts: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_PULL_KEY, ts);
}

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("routinely_user_id");
}

// ─── Push ─────────────────────────────────────────────────────────────────────

async function pushPendingRecords(): Promise<void> {
  const tableDefs = db.tables;

  for (const table of tableDefs) {
    if (table.name === "sync_queue") continue;

    try {
      // Collect records where updated_at > synced_at (or synced_at is null)
      const all = await table.toArray();
      const pending = (all as Array<{ synced_at: string | null; updated_at: string; user_id: string | null }>)
        .filter(
          (r) =>
            r.user_id !== null &&
            (r.synced_at === null || r.updated_at > r.synced_at),
        );

      if (pending.length === 0) continue;

      const res = await fetch("/api/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: table.name, records: pending }),
      });

      if (res.ok) {
        const now = new Date().toISOString();
        // Mark synced_at for each pushed record
        await table.bulkPut(
          pending.map((r) => ({ ...(r as object), synced_at: now })),
        );
      }
    } catch {
      // Network error — will retry on next cycle
    }
  }
}

// ─── Pull ─────────────────────────────────────────────────────────────────────

async function pullRemoteChanges(): Promise<void> {
  const lastPull = getLastPullTimestamp();
  const userId = getUserId();
  if (!userId) return;

  try {
    const url = new URL("/api/sync/pull", window.location.origin);
    if (lastPull) url.searchParams.set("since", lastPull);

    const res = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) return;

    const { tables, pulledAt } = (await res.json()) as {
      tables: Record<string, unknown[]>;
      pulledAt: string;
    };

    for (const [tableName, records] of Object.entries(tables)) {
      if (!records.length) continue;
      const table = db.table(tableName);
      if (!table) continue;
      await table.bulkPut(records);
    }

    setLastPullTimestamp(pulledAt);
  } catch {
    // Network error — will retry
  }
}

// ─── Main sync cycle ──────────────────────────────────────────────────────────

export async function runSync(): Promise<void> {
  const userId = getUserId();
  if (!userId) return; // guest — skip
  if (isSyncing) return;
  if (!navigator.onLine) return;

  isSyncing = true;
  try {
    await pushPendingRecords();
    await pullRemoteChanges();
  } finally {
    isSyncing = false;
  }
}

// ─── Start / stop ─────────────────────────────────────────────────────────────

export function startSyncEngine(): void {
  if (typeof window === "undefined") return;

  // Run immediately on start
  void runSync();

  // Periodic sync
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => void runSync(), SYNC_INTERVAL_MS);

  // Sync immediately when coming back online
  window.addEventListener("online", () => void runSync());
}

export function stopSyncEngine(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

// ─── Guest migration ──────────────────────────────────────────────────────────

/**
 * After a guest user signs up, tag all their local records with the real
 * user_id and trigger an immediate push.
 */
export async function migrateGuestData(newUserId: string): Promise<void> {
  const now = new Date().toISOString();

  for (const table of db.tables) {
    if (table.name === "sync_queue") continue;
    try {
      const guestRecords = await table
        .filter((r) => (r as { user_id: string | null }).user_id === null)
        .toArray();

      if (!guestRecords.length) continue;

      await table.bulkPut(
        guestRecords.map((r) => ({
          ...(r as object),
          user_id: newUserId,
          updated_at: now,
          synced_at: null,
        })),
      );
    } catch {
      // Skip tables that don't support this operation
    }
  }

  // Store the new user id so sync knows who we are
  localStorage.setItem("routinely_user_id", newUserId);

  // Immediately push everything
  await runSync();
}
