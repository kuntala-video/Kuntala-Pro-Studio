import { NextResponse } from "next/server";

export async function POST(req: Request){

    const {text} = await req.json()

    const avatar = {
        model:"AI Presenter",
        voice:"female",
        script:text
    }

    return NextResponse.json(avatar)
}
