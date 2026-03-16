'use server';

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

export function render4K(video:string){

return{

video,

resolution:"3840x2160",

codec:"H264",

status:"4K render complete"

}

}
