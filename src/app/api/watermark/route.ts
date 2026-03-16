import { NextResponse } from "next/server";
import { addWatermark } from "@/lib/watermark";

export async function POST(req: Request) {
  const { video } = await req.json();

  const result = addWatermark(video);

  return NextResponse.json(result);
}
