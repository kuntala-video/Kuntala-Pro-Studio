import { NextResponse } from "next/server";
import { revenue } from "@/lib/money";

export async function POST(req: Request) {
  try {
    const { views } = await req.json();

    if (views === undefined || typeof views !== 'number') {
      return NextResponse.json({ error: "A 'views' number is required in the request body." }, { status: 400 });
    }

    const income = revenue(views);

    return NextResponse.json({
      views,
      income,
    });

  } catch (error: any) {
    console.error("Revenue calculation error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to calculate revenue." }, { status: 500 });
  }
}
