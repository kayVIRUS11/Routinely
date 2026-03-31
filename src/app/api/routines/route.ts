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
  const routines = await prisma.routine.findMany({
    where: { userId, isActive: true },
    orderBy: { startTime: "asc" },
  });
  return NextResponse.json(routines);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const body = await req.json();
  const routine = await prisma.routine.create({
    data: {
      userId,
      title: body.title,
      description: body.description,
      dayOfWeek: body.dayOfWeek ?? [],
      startTime: body.startTime,
      endTime: body.endTime,
      modeId: body.modeId,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(routine, { status: 201 });
}
