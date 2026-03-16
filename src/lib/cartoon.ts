
'use server';

import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "ffmpeg-static"

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

export async function cartoonize(input:string,output:string){

    return new Promise((resolve,reject)=>{

        ffmpeg(input)
        .videoFilters("edgedetect")
        .outputOptions("-preset fast")
        .save(output)
        .on("end",()=>resolve(true))
        .on("error",(err)=>reject(err))

    })

}
