"use client";

import { useRef } from "react";
import { SceneComposer } from "@/components/scene-composer";
import ExportPanel from "@/components/export-panel";
import type { Scene } from "@/lib/types";


export function AnimationWorkspace({ scene }: { scene: Scene | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-grow relative">
                <SceneComposer ref={canvasRef} project={scene ? [scene] : []} />
                 <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <ExportPanel canvasRef={canvasRef} />
                </div>
            </div>
        </div>
    );
}
