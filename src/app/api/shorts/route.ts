import { NextResponse } from "next/server"

export async function POST(req: Request){

const {topic} = await req.json()

const shorts = {

title: topic + " #shorts",

duration: "30 sec",

format:"9:16",

resolution:"1080x1920"

}

return NextResponse.json(shorts)

}
