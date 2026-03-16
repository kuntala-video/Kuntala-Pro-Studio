import { NextResponse } from "next/server"
import { composeMusic } from "@/lib/music-composer"

export async function POST(req:Request){

const {mood} = await req.json()

const music = composeMusic(mood)

return NextResponse.json(music)

}
