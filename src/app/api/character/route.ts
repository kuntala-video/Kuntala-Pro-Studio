import { NextResponse } from "next/server"
import { handleCharacterRequest } from "@/lib/character-engine"

export async function POST(req:Request){
    try {
        const { name, action } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Character 'name' is required." }, { status: 400 });
        }

        const result = handleCharacterRequest(name, action);
        return NextResponse.json(result);

    } catch (error: any) {
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to process character request." }, { status: 500 });
    }
}
