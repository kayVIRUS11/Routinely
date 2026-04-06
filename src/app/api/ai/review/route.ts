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

  const body = (await req.json()) as { modeName?: string; modeData?: unknown };

  const prompt = `Write a motivational weekly review for a Routinely user working on "${body.modeName ?? "their goals"}".
Their recent data: ${JSON.stringify(body.modeData ?? {})}.

Write 2-3 sentences: highlight their best achievement, suggest one improvement area, and close with encouragement. Keep it under 150 words. Plain text only — no markdown, no bullet points.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      safetySettings: SAFETY_SETTINGS,
    });

    const result = await model.generateContent(prompt);
    const review = result.response.text().trim();

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("[AI review] Generation failed:", err);
    return NextResponse.json({ success: false, message: "Could not generate — please try again" }, { status: 500 });
  }
}
