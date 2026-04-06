import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tasks, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", false)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const now = new Date().toISOString();
  const task = {
    id: crypto.randomUUID(),
    user_id: user.id,
    title: body.title,
    description: body.description ?? null,
    due_date: body.due_date ?? null,
    completed: false,
    priority: body.priority ?? "medium",
    is_recurring: body.is_recurring ?? false,
    mode_id: body.mode_id ?? null,
    created_at: now,
    updated_at: now,
    synced_at: now,
    is_deleted: false,
  };

  const { data, error } = await supabaseAdmin.from("tasks").insert(task).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
