import { NextResponse } from "next/server"
import { manageChannels } from "@/lib/channel-manager"

export async function POST(req:Request){
    try {
        const {topics} = await req.json()

        if (!topics || !Array.isArray(topics)) {
            return NextResponse.json({ error: "An array of 'topics' is required in the request body." }, { status: 400 });
        }

        const channels = manageChannels(topics)

        return NextResponse.json({
            status:"100 channel system running",
            channels
        })
    } catch (error: any) {
        console.error("Channel manager error:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to manage channels." }, { status: 500 });
    }
}
