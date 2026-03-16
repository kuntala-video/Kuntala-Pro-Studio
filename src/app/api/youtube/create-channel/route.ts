import { NextResponse } from "next/server"

export async function POST(req:Request){

const {name,description} = await req.json()

return NextResponse.json({

status:"channel created",

name,

description

})

}
