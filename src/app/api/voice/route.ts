import { NextResponse } from "next/server";
import { generateVoice } from "@/lib/voice";

export async function POST(req: Request) {
  try {
    const { text, character } = await req.json();

    if (!text || !character) {
      return NextResponse.json({ error: "Both 'text' and 'character' are required in the request body." }, { status: 400 });
    }

    const voiceData = generateVoice(text, character);

    return NextResponse.json(voiceData);

  } catch (error: any) {
    console.error("Voice generation error:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to generate voice." }, { status: 500 });
  }
}
