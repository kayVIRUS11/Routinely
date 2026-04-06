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

  const { data: routines, error } = await supabaseAdmin
    .from("routines")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("start_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(routines);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const now = new Date().toISOString();
  const routine = {
    id: crypto.randomUUID(),
    user_id: user.id,
    title: body.title,
    description: body.description ?? null,
    day_of_week: body.day_of_week ?? [],
    start_time: body.start_time ?? "09:00",
    end_time: body.end_time ?? "10:00",
    mode_id: body.mode_id ?? null,
    is_active: body.is_active ?? true,
    created_at: now,
    updated_at: now,
    synced_at: now,
    is_deleted: false,
  };

  const { data, error } = await supabaseAdmin.from("routines").insert(routine).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
