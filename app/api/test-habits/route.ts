import { NextResponse } from "next/server";
import { getTodayHabits } from "@/actions/habits";

export async function GET() {
  const result = await getTodayHabits();
  return NextResponse.json(result);
}
