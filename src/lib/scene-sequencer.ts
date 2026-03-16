'use client';

import { Character, BackgroundEngine } from "@/lib/animation";
import type { SceneConfig } from "@/lib/types";

export class SceneSequencer {

  private scenes: SceneConfig[];
  private currentSceneIndex = 0;
  private backgroundEngine = new BackgroundEngine();
  private characters: InstanceType<typeof Character>[] = [];
  private sceneStartTime = 0;
  public isFinished = false;

  constructor(scenes: SceneConfig[]) {
    this.scenes = scenes;
  }

  async loadScene(index: number) {
    if (index >= this.scenes.length) {
      this.isFinished = true;
      return;
    };
    
    const scene = this.scenes[index];
    this.currentSceneIndex = index;
    this.characters = [];

    await this.backgroundEngine.load(scene.background);

    for (const char of scene.characters) {
      const img = new Image();
      img.src = char.src;
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = (err) => {
              console.error(`Failed to load character image from src: ${char.src}`, err);
              reject(new Error(`Failed to load character image: ${char.src}`));
          };
      });

      this.characters.push(
        new Character({
          x: char.x,
          y: char.y,
          speed: char.speed,
          image: img
        })
      );
    }

    this.sceneStartTime = performance.now();
  }

  async start() {
    await this.loadScene(0);
  }

  async update(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (this.isFinished) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const scene = this.scenes[this.currentSceneIndex];
    const now = performance.now();
    const elapsed = (now - this.sceneStartTime) / 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.backgroundEngine.draw(ctx, canvas.width, canvas.height);

    for (const char of this.characters) {
      char.update(16);
      char.draw(ctx);
    }

    if (elapsed >= scene.duration) {
      const nextSceneIndex = this.currentSceneIndex + 1;
      await this.loadScene(nextSceneIndex);
    }
  }
}
