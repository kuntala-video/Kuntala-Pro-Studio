import { NextResponse } from "next/server"
import { editVideo } from "@/lib/video-editor"

export async function POST(req:Request){

const {input,output} = await req.json()

await editVideo(input,output)

return NextResponse.json({

status:"video edited",

output

})

}