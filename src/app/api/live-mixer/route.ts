import { NextResponse } from "next/server";
import { liveMixer } from "@/lib/live-mixer";

export async function POST() {
  const live = liveMixer();
  return NextResponse.json(live);
}
