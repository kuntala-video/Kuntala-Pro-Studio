import { NextResponse } from "next/server"
import { generateFace } from "@/lib/face-generator"

export async function POST(req:Request){

const {character} = await req.json()

const face = generateFace(character)

return NextResponse.json(face)

}
