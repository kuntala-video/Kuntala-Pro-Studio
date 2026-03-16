import { NextResponse } from "next/server"
import { createReel } from "@/lib/reel"

export async function POST(req:Request){
  try {
    const { video } = await req.json()

    if (!video || typeof video !== 'string') {
        return NextResponse.json({ error: "A 'video' path string is required in the request body." }, { status: 400 });
    }

    const output = "public/reel.mp4"

    await createReel(video, output)

    return NextResponse.json({
        status:"reel generated",
        output
    })
  } catch (error: any) {
    console.error("Reel creation error:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create reel." }, { status: 500 });
  }
}
