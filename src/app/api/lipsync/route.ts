import { NextResponse } from "next/server";
import { generateLipSync } from "@/lib/lipsync";

export async function POST(req: Request) {
  const { text, character } = await req.json();

  const result = generateLipSync(text, character);

  return NextResponse.json(result);
}
