import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ success: false, message: "AI service is not configured" }, { status: 503 });
  }

  const body = (await req.json()) as { usageData?: unknown; activeModes?: string[]; guest?: boolean };

  if (body.guest === true) {
    return NextResponse.json({ success: false, message: "Sign up to unlock AI features" }, { status: 401 });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ success: false, message: "AI service is temporarily unavailable" }, { status: 503 });
  }

  const prompt = `You are an adaptive planning AI for Routinely, a personal productivity app.
The user has these active modes: ${(body.activeModes ?? []).join(", ")}.
Their recent usage patterns: ${JSON.stringify(body.usageData ?? {})}.

Generate 3 personalised planning suggestions to help them improve. Return ONLY a valid JSON array. No markdown.
Each object must have:
- title: short suggestion title (3-5 words)
- description: one sentence explaining the suggestion
- mode: which mode it applies to (or "general")
- action: what to do (e.g. "schedule_study_session", "set_budget", "log_workout")

Example:
[{"title":"Revise daily study time","description":"You often study at 9am — block it as a recurring routine.","mode":"study","action":"schedule_study_session"}]`;

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.7,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    if (!data.choices?.length) {
      throw new Error("OpenRouter returned no choices");
    }
    const text = data.choices[0].message.content.trim();
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const suggestions = JSON.parse(json) as unknown[];

    return NextResponse.json({ success: true, suggestions });
  } catch (err) {
    console.error("[AI suggestions] Generation failed:", err);
    return NextResponse.json({ success: false, message: "Could not generate — please try again" }, { status: 500 });
  }
}
