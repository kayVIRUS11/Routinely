import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, context } = await req.json();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Context: ${JSON.stringify(context)}\n\nUser message: ${message}`,
      },
    ],
    system: "You are Routinely's AI assistant helping users manage their daily life, routines, and goals. Be concise, helpful, and motivational.",
  });

  return NextResponse.json({
    response: response.content[0].type === "text" ? response.content[0].text : "",
  });
}
