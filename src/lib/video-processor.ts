'use server';

import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from 'ffmpeg-static';
import path from "path";

// It's good practice to set the path to the static binary.
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Example function to render a video using fluent-ffmpeg.
 * NOTE: This is a server-side function and requires an `input.mp4` file
 * in the root of your project directory to work.
 */
export function renderVideo(){

    const input = path.join(process.cwd(),"input.mp4")
    const output = path.join(process.cwd(),"output.mp4")

    ffmpeg(input)
        .videoCodec("libx264")
        .size("1920x1080")
        .on('error', (err) => {
            console.error('An error occurred: ' + err.message);
        })
        .on('end', () => {
            console.log('Processing finished !');
        })
        .save(output);
}
