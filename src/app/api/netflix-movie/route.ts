import { NextResponse } from "next/server"
import { generateNetflixSeriesPlan } from "@/ai/flows/generate-netflix-series-plan"

export async function POST(req:Request){
    try {
        const {topic} = await req.json()

        if (!topic) {
            return NextResponse.json({ error: "A 'topic' is required." }, { status: 400 });
        }

        const movie = await generateNetflixSeriesPlan({ topic });

        return NextResponse.json(movie)
    } catch (e: any) {
        console.error("Netflix movie generator error:", e);
        return NextResponse.json({ error: "Failed to generate series plan." }, { status: 500 });
    }
}
