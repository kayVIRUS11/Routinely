/**
 * Legacy NextAuth route — superseded by Supabase Auth.
 * @deprecated
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Auth is handled by Supabase" }, { status: 200 });
}

export async function POST() {
  return NextResponse.json({ message: "Auth is handled by Supabase" }, { status: 200 });
}
