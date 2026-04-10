import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ─── Safety settings (applied to all Gemini calls) ────────────────────────────

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildPrompt(feature: string, body: Record<string, unknown>): string {
  switch (feature) {
    case "achievements":
      return `Generate exactly 4 achievements for a custom mode called "${body.modeName}" with sections: ${(body.sections as string[]).join(", ")}.
Return ONLY a JSON array with objects having "name" and "description" fields.
Example: [{"name":"First Step","description":"Started your ${body.modeName} journey"}]`;

    case "routine":
      return `Create a daily routine schedule for a user who wants to focus on: ${body.goal}.
Their available time blocks: ${JSON.stringify(body.availability)}.
Return ONLY a JSON array of routine slots with fields: title (string), startTime (HH:MM), endTime (HH:MM), day (one of: Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday).`;

    case "route":
      return `You are a smart input router for a productivity app called Routinely. The app has these modes: study, financial, fitness, professional, general, and custom modes.
The user said: "${body.message}"
Identify what they want to do and which mode it belongs to. Return ONLY a JSON object with:
{
  "mode": "study|financial|fitness|professional|general",
  "action": "add_task|add_expense|add_habit|add_routine|log_workout|add_goal|add_note",
  "data": { /* relevant extracted fields */ },
  "response": "A short friendly confirmation message"
}`;

    case "review":
      return `Generate a motivational weekly review for a user of the Routinely productivity app.
Their data: ${JSON.stringify(body.modeData)}.
Write 2-3 sentences highlighting their progress, one area to improve, and an encouraging closing. Keep it under 100 words.`;

    default:
      // General assistant fallback
      return `Context: ${JSON.stringify(body.context ?? {})}\n\nUser message: ${body.message ?? ""}`;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI service is not configured" }, { status: 503 });
  }

  const body = (await req.json()) as Record<string, unknown>;

  // Guests must sign up before using AI features
  if (body.guest === true) {
    return NextResponse.json(
      { error: "Sign up to unlock AI features" },
      { status: 401 },
    );
  }

  // Require a valid Supabase session token
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "AI service is temporarily unavailable" }, { status: 503 });
  }

  const feature = typeof body.feature === "string" ? body.feature : "general";
  const prompt = buildPrompt(feature, body);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction:
        "You are Routinely's AI assistant helping users manage their daily life, routines, and goals. Be concise, helpful, and motivational.",
      safetySettings: SAFETY_SETTINGS,
    });

    const result = await model.generateContent(prompt);

    return NextResponse.json({
      response: result.response.text(),
      feature,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
