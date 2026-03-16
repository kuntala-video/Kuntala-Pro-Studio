'use server';

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath as string);
}

export async function createReel(input:string,output:string){

return new Promise((resolve,reject)=>{

ffmpeg(input)

.videoFilters("scale=1080:1920")

.outputOptions("-preset fast")

.save(output)

.on("end",()=>resolve(true))

.on("error",(err)=>reject(err))

})

}
