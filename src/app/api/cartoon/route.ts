import { NextResponse } from "next/server"
import { cartoonize } from "@/lib/cartoon"

export async function POST(req:Request){
    try {
        const {video} = await req.json();

        if (!video || typeof video !== 'string') {
            return NextResponse.json({ error: "A 'video' path string is required in the request body." }, { status: 400 });
        }

        const output = "public/cartoon.mp4"

        await cartoonize(video,output)

        return NextResponse.json({
            status:"cartoon created",
            output
        })
    } catch (error: any) {
        console.error("Cartoonization error:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to cartoonize video." }, { status: 500 });
    }
}
