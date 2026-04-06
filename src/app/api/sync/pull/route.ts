import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_TABLES = [
  "modes", "tasks", "routines", "habits", "habit_logs", "pomodoro_sessions",
  "subjects", "timetable_entries", "exams", "study_sessions", "assignments",
  "income_entries", "expense_entries", "budgets", "savings_goals", "bills",
  "workout_plans", "workout_logs", "body_metrics", "projects", "meeting_logs",
  "personal_goals", "journal_entries", "achievements", "skill_unlocks",
];

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");

  const pulledAt = new Date().toISOString();
  const tables: Record<string, unknown[]> = {};

  for (const table of ALLOWED_TABLES) {
    let query = supabaseAdmin
      .from(table)
      .select("*")
      .eq("user_id", user.id);

    if (since) {
      query = query.gt("updated_at", since);
    }

    const { data, error } = await query;
    if (!error && data) {
      tables[table] = data;
    }
  }

  return NextResponse.json({ tables, pulledAt });
}
