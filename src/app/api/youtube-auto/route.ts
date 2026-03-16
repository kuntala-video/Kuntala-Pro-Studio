import { NextResponse } from "next/server"

export async function POST(req:Request){

const {topic} = await req.json()

const automation = {

script:"generated",

voice:"generated",

video:"rendered",

thumbnail:"generated",

upload:"youtube completed"

}

return NextResponse.json({

status:"Automation Complete",

topic,

automation

})

}
