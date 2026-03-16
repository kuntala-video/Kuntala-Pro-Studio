import { NextResponse } from 'next/server';

export async function POST(){
    return NextResponse.json(
        { error: "Automatic payments are disabled." }, 
        { status: 501 } // 501 Not Implemented
    );
}
