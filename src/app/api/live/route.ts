import { NextResponse } from "next/server";
import { startStream } from "@/lib/livestream";

export async function GET() {
  try {
    const result = startStream();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to start live stream server:", error);
    return new NextResponse("Failed to start stream server", { status: 500 });
  }
}
