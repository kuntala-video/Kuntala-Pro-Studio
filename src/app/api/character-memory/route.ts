import { NextResponse } from "next/server";
import { characterMemory } from "@/lib/character-memory";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "A character 'name' is required." }, { status: 400 });
    }

    const result = characterMemory(name);
    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
