import { NextResponse } from "next/server"
import { generateMovie } from "@/lib/movie-generator"

export async function POST(req:Request){
    try {
        const {scenes} = await req.json()

        if (!scenes || !Array.isArray(scenes)) {
            return NextResponse.json({ error: "A 'scenes' array is required in the request body." }, { status: 400 });
        }

        const output = "public/movie.mp4"

        await generateMovie(scenes,output)

        return NextResponse.json({
            status:"movie generated",
            video:output
        })
    } catch (error: any) {
        console.error("Movie generation error:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to generate movie." }, { status: 500 });
    }
}
