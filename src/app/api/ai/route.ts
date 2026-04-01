import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI service is not configured" }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, context } = await req.json();

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
      "You are Routinely's AI assistant helping users manage their daily life, routines, and goals. Be concise, helpful, and motivational.",
  });

  const result = await model.generateContent(
    `Context: ${JSON.stringify(context)}\n\nUser message: ${message}`
  );

  return NextResponse.json({
    response: result.response.text(),
  });
}
