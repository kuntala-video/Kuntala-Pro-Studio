'use client';

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private stream: MediaStream | null = null;

  start(canvas: HTMLCanvasElement, fps: number = 60) {
    this.stream = canvas.captureStream(fps);

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'video/webm;codecs=vp9',
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        return reject(new Error('Recorder is not currently recording.'));
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        this.chunks = [];
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }
        resolve(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error('An error occurred with the MediaRecorder.'));
      };

      this.mediaRecorder.stop();
    });
  }
}
