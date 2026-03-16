import { NextResponse } from "next/server";
import { animateCharacter } from "@/lib/character-animation";

export async function POST(req: Request) {
  const { character, action } = await req.json();

  const animation = animateCharacter(character, action);

  return NextResponse.json(animation);
}
