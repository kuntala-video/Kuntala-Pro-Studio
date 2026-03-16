import { NextResponse } from "next/server";
import { generateAvatar } from "@/ai/flows/generate-avatar";

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "A 'description' is required." }, { status: 400 });
    }

    const result = await generateAvatar({ description });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Avatar Generation API error:", error);
    return NextResponse.json({ error: "Failed to generate avatar." }, { status: 500 });
  }
}
