import { NextResponse } from "next/server"

export async function POST(){

const thumbnail = "/thumbnail.png"

return NextResponse.json({

thumbnail

})

}
