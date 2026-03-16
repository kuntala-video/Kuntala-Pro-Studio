import { NextResponse } from "next/server";
import { generateYoutubeMetadata } from "@/ai/flows/generate-youtube-metadata";
import type { YoutubeMetadataInput } from "@/ai/flows/generate-youtube-metadata";

export async function POST(req: Request) {
  try {
    const body = await req.json() as YoutubeMetadataInput;

    if (!body.prompt) {
      return NextResponse.json({ error: "A 'prompt' is required." }, { status: 400 });
    }

    const result = await generateYoutubeMetadata(body);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("YouTube Metadata Generation API error:", error);
    const errorMessage = error.message || "Failed to generate metadata.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
