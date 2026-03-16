import { NextResponse } from "next/server"
import { generateChannels } from "@/lib/channel-factory"

export async function POST(){

const factory = generateChannels()

return NextResponse.json(factory)

}
