
import type { TimelineFrame } from './types';

export class TimelineEngine {

  private frames: TimelineFrame[] = []
  private duration: number = 0

  addFrame(frame: TimelineFrame) {
    this.frames.push(frame)
    if (frame.time > this.duration) {
      this.duration = frame.time
    }
  }

  getDuration() {
    return this.duration
  }

  render(ctx: CanvasRenderingContext2D, currentTime: number) {
    this.frames.forEach(frame => {
      if (currentTime >= frame.time) {
        frame.draw(ctx)
      }
    })
  }
}
