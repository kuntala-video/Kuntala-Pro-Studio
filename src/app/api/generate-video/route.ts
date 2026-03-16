import { NextResponse } from "next/server";
import { generateVideo } from "@/ai/flows/text-to-video";
import type { TextToVideoInput } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json() as TextToVideoInput;

    if (!body.prompt) {
      return NextResponse.json({ error: "A 'prompt' is required." }, { status: 400 });
    }

    const result = await generateVideo(body);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Video Generation API error:", error);
    const errorMessage = error.message || "Failed to generate video.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
