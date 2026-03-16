
'use server';

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

export async function editVideo(input: string, output: string) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .videoFilters("drawtext=text='AI Generated':x=10:y=10:fontsize=30:fontcolor=white")
            .outputOptions("-preset veryfast")
            .save(output)
            .on("end", () => resolve(true))
            .on("error", (err) => reject(err));
    });
}
