import { NextResponse } from "next/server";
import { generateEpisodes } from "@/ai/flows/generate-episodes";

export async function POST(req: Request) {
  try {
    const { title, total } = await req.json();

    if (!title || !total) {
      return NextResponse.json({ error: "Both 'title' and 'total' are required." }, { status: 400 });
    }

    const result = await generateEpisodes({ title, total });
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Episode engine error:", error);
    return NextResponse.json({ error: "Failed to generate episodes." }, { status: 500 });
  }
}
