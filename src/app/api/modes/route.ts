import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const modes = await prisma.userMode.findMany({
    where: { userId, isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(modes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const body = await req.json();
  const mode = await prisma.userMode.create({
    data: { ...body, userId },
  });
  return NextResponse.json(mode, { status: 201 });
}
