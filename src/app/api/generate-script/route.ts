import { NextResponse } from "next/server";
import { generateScript } from "@/ai/flows/generate-script";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "A 'topic' is required." }, { status: 400 });
    }

    const result = await generateScript({ topic });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Script Generation API error:", error);
    return NextResponse.json({ error: "Failed to generate script." }, { status: 500 });
  }
}
