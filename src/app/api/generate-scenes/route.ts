import { NextResponse } from "next/server"
import { generateScene } from "@/lib/scene-generator"

export async function POST(req:Request){
    try {
        const {location} = await req.json()

        if (location === undefined) {
            return NextResponse.json({ error: "A 'location' string is required." }, { status: 400 });
        }

        const scene = generateScene(location)

        return NextResponse.json({
            scene
        })
    } catch (error: any) {
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
        }
        console.error("Scene generation error:", error);
        return NextResponse.json({ error: "Failed to generate scene." }, { status: 500 });
    }
}
