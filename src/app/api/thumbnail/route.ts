import { NextResponse } from "next/server";
import { generateThumbnail } from "@/lib/thumbnail";

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "A 'title' is required in the request body." }, { status: 400 });
    }

    const thumbnail = generateThumbnail(title);

    return NextResponse.json(thumbnail);
  } catch (error: any) {
    console.error("Thumbnail generation error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to generate thumbnail." }, { status: 500 });
  }
}
