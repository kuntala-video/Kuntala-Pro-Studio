import { NextResponse } from "next/server";
import { renderVideo } from "@/lib/video-processor";

export async function POST(){
  renderVideo()
  return NextResponse.json({
    status:"movie rendering started"
  })
}
