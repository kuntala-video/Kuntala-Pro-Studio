import { NextResponse } from "next/server";
import { createAvatar } from "@/lib/avatar3d";

export async function POST(req: Request) {
  const { name } = await req.json();

  const avatar = createAvatar(name);

  return NextResponse.json(avatar);
}
