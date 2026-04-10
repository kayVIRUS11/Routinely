import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ success: false, message: "AI service is not configured" }, { status: 503 });
  }

  const body = (await req.json()) as { description?: string; availability?: unknown; guest?: boolean };

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

  const prompt = `Create a weekly routine schedule based on this goal: "${body.description ?? ""}".
Available time blocks: ${JSON.stringify(body.availability ?? {})}.

Return ONLY a valid JSON array. No markdown, no explanation. Each object must have:
- title: string (routine title)
- day: one of Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday
- startTime: HH:MM (24-hour)
- endTime: HH:MM (24-hour)

Example:
[{"title":"Morning Study","day":"Monday","startTime":"09:00","endTime":"11:00"}]`;

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
        max_tokens: 1000,
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
    const routine = JSON.parse(json) as unknown[];

    return NextResponse.json({ success: true, routine });
  } catch (err) {
    console.error("[AI routine] Generation failed:", err);
    return NextResponse.json({ success: false, message: "Could not generate — please try again" }, { status: 500 });
  }
}
