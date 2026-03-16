import { NextResponse } from "next/server"
import { generateCameraPlan } from "@/ai/flows/generate-camera-plan"

export async function POST(req:Request){
    try {
        const {scene} = await req.json();

        if (!scene) {
            return NextResponse.json({ error: "A 'scene' description is required." }, { status: 400 });
        }

        const cameraPlan = await generateCameraPlan({ scene });

        return NextResponse.json(cameraPlan);
    } catch(e: any) {
        console.error("Cinematic camera error:", e);
        return NextResponse.json({ error: "Failed to generate camera plan." }, { status: 500 });
    }
}
