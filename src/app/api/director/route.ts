import { NextResponse } from "next/server";
import { generateDirectorPlan } from "@/ai/flows/generate-director-plan";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "A 'topic' is required in the request body." }, { status: 400 });
    }

    const result = await generateDirectorPlan({ topic });
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Director API error:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process director request." }, { status: 500 });
  }
}
