import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ success: false, message: "AI service is not configured" }, { status: 503 });
  }

  const body = (await req.json()) as { modeName?: string; sections?: string[]; guest?: boolean };

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

  const prompt = `Generate exactly 8 achievements for a custom productivity mode called "${body.modeName ?? "My Mode"}" with these sections: ${(body.sections ?? []).join(", ")}.

Return ONLY a valid JSON array. No markdown, no explanation. Each object must have:
- key: unique snake_case identifier
- name: short achievement name (2-4 words)
- description: what the user did to earn it (1 sentence)
- trigger_condition: when it fires (e.g. "complete_5_tasks")
- icon_suggestion: a single emoji

Example format:
[{"key":"first_task","name":"First Task","description":"Completed your first task.","trigger_condition":"complete_1_task","icon_suggestion":"✅"}]`;

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const text = data.choices[0].message.content.trim();

    // Strip markdown code fences if present
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const achievements = JSON.parse(json) as unknown[];

    return NextResponse.json({ success: true, achievements });
  } catch (err) {
    console.error("[AI achievements] Generation failed:", err);
    return NextResponse.json({ success: false, message: "Could not generate — please try again" }, { status: 500 });
  }
}
