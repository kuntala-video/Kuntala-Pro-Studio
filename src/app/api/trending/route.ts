import { NextResponse } from "next/server"
import { getTrending } from "@/lib/trending"

export async function GET(){

const trends = await getTrending()

return NextResponse.json(trends)

}
