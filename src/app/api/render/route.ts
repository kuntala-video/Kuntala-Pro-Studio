import { NextResponse } from "next/server";
import { render4K } from "@/lib/render";

export async function POST(req: Request) {
  const { video } = await req.json();

  const result = render4K(video);

  return NextResponse.json(result);
}
