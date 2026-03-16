import { NextResponse } from "next/server"

export async function POST(req:Request){

const {topic} = await req.json()

const pipeline = {

topic,

steps:[

"Generate Story",

"Create Characters",

"Generate Face",

"Create Scene",

"Animate Character",

"Generate Voice",

"Apply Lip Sync",

"Compose Music",

"Render Video",

"Add Watermark",

"Generate Thumbnail",

"Upload To YouTube"

],

status:"movie pipeline started"

}

return NextResponse.json(pipeline)

}
