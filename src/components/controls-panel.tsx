'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Scene } from "@/lib/types";
import { Layers, User } from "lucide-react";
import Image from "next/image";

export default function ControlsPanel({ scene }: { scene: Scene | null }) {
  return (
    <>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel className="font-headline text-lg tracking-wider">Controls</SidebarGroupLabel>
        </SidebarGroup>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent>
          <div className="p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Layers /> Scene Layers</CardTitle>
                    <CardDescription>Objects in the current scene, ordered from back to front.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {scene?.background && (
                         <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <Image src={scene.background} alt="background" width={32} height={32} className="rounded-sm aspect-square object-cover" />
                            <span>Background</span>
                         </div>
                    )}
                    {scene?.characters?.map((char, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                           <Image src={char.src} alt={`character ${index+1}`} width={32} height={32} className="rounded-sm aspect-square object-cover bg-white" />
                           <span>Character {index + 1}</span>
                        </div>
                    ))}
                    {(!scene?.characters || scene.characters.length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-4">No characters in this scene.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Selected Object</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-xs text-muted-foreground text-center">Select an object on the canvas to edit its properties. (Coming soon)</p>
                    <div className="grid gap-2">
                        <Label>Position X</Label>
                        <Slider defaultValue={[50]} max={100} step={1} disabled />
                    </div>
                     <div className="grid gap-2">
                        <Label>Position Y</Label>
                        <Slider defaultValue={[50]} max={100} step={1} disabled />
                    </div>
                </CardContent>
            </Card>
          </div>
        </SidebarContent>
      </ScrollArea>
    </>
  );
}
