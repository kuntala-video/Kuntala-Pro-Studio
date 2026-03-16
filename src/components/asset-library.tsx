"use client";

import Image from "next/image";
import { useMemo } from "react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { placeholderImages } from "@/lib/placeholder-images";
import type { ImagePlaceholder, Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AssetLibrary({ project, onAssetClick }: { project: Project | null, onAssetClick?: (asset: ImagePlaceholder) => void }) {
  const props = placeholderImages.filter((img) => img.category === "prop");
  const backgrounds = placeholderImages.filter((img) => img.category === "background");

  const projectCharacters = useMemo(() => {
    return project?.characters?.map(char => ({
      id: char.id,
      description: char.name,
      imageUrl: char.style, // Assuming char.style is an image URL
      imageHint: char.traits.split(' ').slice(0, 2).join(' '),
      category: 'character' as const,
    })) || [];
  }, [project]);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ImagePlaceholder) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const renderAssetGrid = (assets: ImagePlaceholder[]) => (
    <div className="grid grid-cols-2 gap-4 p-4">
      {assets.map((item) => (
        <div
          key={item.id}
          draggable={!onAssetClick}
          onClick={() => onAssetClick?.(item)}
          onDragStart={(e) => !onAssetClick && handleDragStart(e, item)}
          className={onAssetClick ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}
        >
          <Card className="overflow-hidden transition-all hover:ring-2 hover:ring-primary">
            <CardContent className="p-0">
              <Image
                src={item.imageUrl}
                alt={item.description}
                width={150}
                height={200}
                className="w-full h-auto object-cover aspect-[3/4]"
                data-ai-hint={item.imageHint}
              />
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-1 text-center truncate">{item.description}</p>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel className="font-headline text-lg tracking-wider">
            {project ? project.title : 'Asset Library'}
          </SidebarGroupLabel>
        </SidebarGroup>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent>
            <Tabs defaultValue="characters" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-card z-10 px-2">
                <TabsTrigger value="characters">Chars</TabsTrigger>
                <TabsTrigger value="props">Props</TabsTrigger>
                <TabsTrigger value="backgrounds">BGs</TabsTrigger>
              </TabsList>
              <TabsContent value="characters" className="mt-4">
                 {projectCharacters.length > 0 ? (
                    renderAssetGrid(projectCharacters)
                 ) : (
                    <p className="p-4 text-sm text-muted-foreground text-center">No characters in this project.</p>
                 )}
              </TabsContent>
              <TabsContent value="props" className="mt-4">
                {renderAssetGrid(props)}
              </TabsContent>
              <TabsContent value="backgrounds" className="mt-4">
                {renderAssetGrid(backgrounds)}
              </TabsContent>
            </Tabs>
        </SidebarContent>
      </ScrollArea>
    </>
  );
}
