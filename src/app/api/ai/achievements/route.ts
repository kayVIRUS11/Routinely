import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      safetySettings: SAFETY_SETTINGS,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const achievements = JSON.parse(json) as unknown[];

    return NextResponse.json({ success: true, achievements });
  } catch (err) {
    console.error("[AI achievements] Generation failed:", err);
    return NextResponse.json({ success: false, message: "Could not generate — please try again" }, { status: 500 });
  }
}
