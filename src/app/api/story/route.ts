import { NextResponse } from "next/server";
import { StoryGeneratorService } from "@/lib/story-generator";
import type { StoryIdeaGeneratorInput } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body: StoryIdeaGeneratorInput = await req.json();

    if (!body.userRequest) {
      return NextResponse.json({ error: "A 'userRequest' is required in the request body." }, { status: 400 });
    }

    const result = await StoryGeneratorService.generateStoryIdea(body);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Story API error:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to generate story." }, { status: 500 });
  }
}
