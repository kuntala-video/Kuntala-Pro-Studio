'use server';

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

export async function generateMovie(sceneList:string[],output:string){

return new Promise((resolve,reject)=>{

let command = ffmpeg()

sceneList.forEach((scene)=>{

command = command.input(scene)

})

command

.on("end",()=>resolve(true))

.on("error",(err)=>reject(err))

.mergeToFile(output)

})

}
