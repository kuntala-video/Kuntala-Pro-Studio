"use client"

import { useEffect, useRef, forwardRef } from "react"
import type { SceneConfig } from "@/lib/types"

export const SceneComposer = forwardRef<HTMLCanvasElement, { project?: SceneConfig[] }>(
  function SceneComposer({ project = [] }, ref) {

  useEffect(() => {
    const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawScene = async (scene: SceneConfig) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        const background = new Image();
        background.crossOrigin = "anonymous";
        background.src = scene.background;
        try {
            await new Promise<void>((resolve, reject) => {
                background.onload = () => resolve();
                background.onerror = reject;
            });
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            console.error("Failed to load background image:", scene.background);
            // Draw a fallback background
            ctx.fillStyle = '#18181b'; // zinc-900
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '30px sans-serif';
            ctx.fillText('Background failed to load', 50, 50);
        }

        // Draw characters
        for (const charConfig of scene.characters) {
            const charImg = new Image();
            charImg.crossOrigin = "anonymous";
            charImg.src = charConfig.src;
             try {
                await new Promise<void>((resolve, reject) => {
                    charImg.onload = () => resolve();
                    charImg.onerror = reject;
                });
                // Using a fixed size for now to make them visible
                const charWidth = 200;
                const charHeight = 200 * (charImg.height / charImg.width) || 200;
                ctx.drawImage(charImg, charConfig.x, charConfig.y, charWidth, charHeight);
            } catch (e) {
                console.error("Failed to load character image:", charConfig.src);
                 // Draw a fallback for the character
                ctx.fillStyle = 'red';
                ctx.fillRect(charConfig.x, charConfig.y, 100, 150);
            }
        }
    };
    
    if (project && project.length > 0) {
        // We are in "editor" mode, so we only draw the first scene in the array
        drawScene(project[0]);
    } else {
        // Clear canvas if no scene
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

  }, [project, ref]); // Redraw whenever the project scenes change

  return (
    <canvas
      ref={ref}
      width={1920} // Using 1080p for better performance during editing
      height={1080}
      className="w-full h-auto aspect-video rounded-xl bg-card border"
    />
  )
});

SceneComposer.displayName = "SceneComposer";
