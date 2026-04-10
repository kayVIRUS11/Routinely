import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ success: false, message: "AI service is not configured" }, { status: 503 });
  }

  const body = (await req.json()) as { modeName?: string; modeData?: unknown; guest?: boolean };

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

  const prompt = `Write a motivational weekly review for a Routinely user working on "${body.modeName ?? "their goals"}".
Their recent data: ${JSON.stringify(body.modeData ?? {})}.

Write 2-3 sentences: highlight their best achievement, suggest one improvement area, and close with encouragement. Keep it under 150 words. Plain text only — no markdown, no bullet points.`;

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
        max_tokens: 300,
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
    const review = data.choices[0].message.content.trim();

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("[AI review] Generation failed:", err);
    return NextResponse.json({ success: false, message: "Could not generate — please try again" }, { status: 500 });
  }
}
