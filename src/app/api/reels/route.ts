import { NextResponse } from "next/server"
import { generateReel } from "@/lib/reels-generator"

export async function POST(req:Request){

    const {topic} = await req.json()

    const reel = generateReel(topic)

    return NextResponse.json(reel)

}
