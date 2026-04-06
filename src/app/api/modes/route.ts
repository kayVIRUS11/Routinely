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

  const { data: modes, error } = await supabaseAdmin
    .from("modes")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(modes);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const now = new Date().toISOString();
  const mode = {
    id: crypto.randomUUID(),
    user_id: user.id,
    mode_type: body.mode_type ?? "custom",
    name: body.name ?? "New Mode",
    icon: body.icon ?? null,
    is_active: body.is_active ?? true,
    order: body.order ?? 0,
    sections: body.sections ?? [],
    created_at: now,
    updated_at: now,
    synced_at: now,
    is_deleted: false,
  };

  const { data, error } = await supabaseAdmin.from("modes").insert(mode).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
