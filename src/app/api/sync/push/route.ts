import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_TABLES = [
  "modes", "tasks", "routines", "habits", "habit_logs", "pomodoro_sessions",
  "subjects", "timetable_entries", "exams", "study_sessions", "assignments",
  "income_entries", "expense_entries", "budgets", "savings_goals", "bills",
  "workout_plans", "workout_logs", "body_metrics", "projects", "meeting_logs",
  "personal_goals", "journal_entries", "achievements", "skill_unlocks",
];

export async function POST(req: NextRequest) {
  // Authenticate via Supabase JWT
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { table: string; records: Record<string, unknown>[] };
  const { table, records } = body;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  if (!records?.length) {
    return NextResponse.json({ synced: 0 });
  }

  // Validate that records belong to the authenticated user before accepting them
  const invalidRecord = records.find(
    (r) => r.user_id !== undefined && r.user_id !== user.id,
  );
  if (invalidRecord) {
    return NextResponse.json(
      { error: "Record user_id does not match the authenticated user" },
      { status: 400 },
    );
  }

  // Enforce user_id matches the authenticated user
  const safeRecords = records.map((r) => ({ ...r, user_id: user.id }));

  const now = new Date().toISOString();
  const withSyncedAt = safeRecords.map((r) => ({ ...r, synced_at: now }));

  const { error } = await supabaseAdmin.from(table).upsert(withSyncedAt, {
    onConflict: "id",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: withSyncedAt.length });
}
