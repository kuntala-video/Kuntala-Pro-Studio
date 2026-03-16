import { NextResponse } from "next/server"
import { cloneVoice } from "@/lib/voice-clone"

export async function POST(req:Request){

const {name,text} = await req.json()

const result = cloneVoice(name,text)

return NextResponse.json(result)

}
