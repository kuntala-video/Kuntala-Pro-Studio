import type { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpeg: FFmpeg | null = null;

export async function renderCanvasToVideo(
  canvas: HTMLCanvasElement,
  duration: number,
  fps: number,
  quality: "1080p" | "4K",
  watermarkPath?: string
) {
  if (!ffmpeg) {
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
    ffmpeg = createFFmpeg({ log: true });
  }
  
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm'
  });

  const chunks: BlobPart[] = [];

  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  await new Promise(resolve => setTimeout(resolve, duration * 1000));

  recorder.stop();

  await new Promise<void>(resolve => {
    recorder.onstop = () => resolve();
  });

  const blob = new Blob(chunks, { type: 'video/webm' });
  const file = new File([blob], 'input.webm');
  
  const { fetchFile } = await import('@ffmpeg/ffmpeg');
  ffmpeg.FS('writeFile', 'input.webm', await fetchFile(file));

  const resolution = quality === "4K" ? "3840x2160" : "1920x1080";
  
  const ffmpegArgs = ['-i', 'input.webm'];

  if (watermarkPath) {
    const watermarkFile = watermarkPath.split('/').pop() || 'watermark.png';
    ffmpeg.FS('writeFile', watermarkFile, await fetchFile(watermarkPath));
    ffmpegArgs.push('-i', watermarkFile);
    ffmpegArgs.push('-filter_complex', '[0:v][1:v] overlay=W-w-10:H-h-10'); // bottom-right corner
  }

  ffmpegArgs.push('-s', resolution, 'output.mp4');

  await ffmpeg.run(...ffmpegArgs);

  const data = ffmpeg.FS('readFile', 'output.mp4');

  return new Blob([data.buffer], { type: 'video/mp4' });
}
