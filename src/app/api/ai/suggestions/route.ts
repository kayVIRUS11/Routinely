import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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

  const body = (await req.json()) as { usageData?: unknown; activeModes?: string[] };

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
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
      safetySettings: SAFETY_SETTINGS,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const suggestions = JSON.parse(json) as unknown[];

    return NextResponse.json({ success: true, suggestions });
  } catch {
    return NextResponse.json({ success: false, message: "Could not generate — please try again" }, { status: 500 });
  }
}
