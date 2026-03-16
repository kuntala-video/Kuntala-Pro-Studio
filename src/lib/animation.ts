import type { CharacterConfig } from './types';

export class Character {

  private config: CharacterConfig;

  constructor(config: CharacterConfig) {
    this.config = config;
  }

  public update(delta: number): void {
    this.config.x += this.config.speed * delta;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(
      this.config.image,
      this.config.x,
      this.config.y,
      120,
      120
    );
  }
}

export class BackgroundEngine {
  private image: HTMLImageElement | null = null;

  async load(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Allow loading images from other domains
      img.src = src;
      img.onload = () => {
        this.image = img;
        resolve();
      };
      img.onerror = (err) => {
        console.error(`Failed to load image from src: ${src}`, err);
        reject(new Error(`Failed to load image: ${src}`));
      };
    });
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.image) return;
    ctx.drawImage(this.image, 0, 0, width, height);
  }
}
