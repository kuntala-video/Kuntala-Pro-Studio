'use client';

import { useProject } from '@/context/project-context';
import { AnimationWorkspace } from '@/components/animation-workspace';
import AssetLibrary from '@/components/asset-library';
import ControlsPanel from '@/components/controls-panel';
import { Loader2, FolderKanban } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import type { Project, Scene, ImagePlaceholder } from '@/lib/types';
import { ProjectService } from '@/lib/projects';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useFirebase } from '@/firebase';

export function AnimationStudioContent() {
    const { selectedProject, selectedProjectId, isLoading } = useProject();
    const { auth, db } = useFirebase();
    const { toast } = useToast();
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);

    useEffect(() => {
        if (selectedProject?.scenes && selectedProject.scenes.length > 0) {
            // If there's no current scene, or the current scene is not in the project, default to the first one.
            if (!currentScene || !selectedProject.scenes.find(s => s.id === currentScene.id)) {
                setCurrentScene(selectedProject.scenes.sort((a, b) => a.order - b.order)[0]);
            }
        } else {
            setCurrentScene(null);
        }
    }, [selectedProject, currentScene]);

    const handleAssetClick = async (asset: ImagePlaceholder) => {
        if (!currentScene || !selectedProject || !selectedProjectId || !db || !auth) {
            toast({ title: 'No scene or Firebase connection', description: 'Please select a scene and ensure you are connected.', variant: 'destructive' });
            return;
        }

        let updatedScene: Scene | null = null;
        let successMessage = '';

        if (asset.category === 'character') {
            const newCharacter = {
                src: asset.imageUrl,
                x: 100, // default position
                y: 100,
                speed: 0, // not moving initially
            };
            
            updatedScene = {
                ...currentScene,
                characters: [...(currentScene.characters || []), newCharacter],
            };
            successMessage = 'Character added to scene';

        } else if (asset.category === 'background') {
             updatedScene = { ...currentScene, background: asset.imageUrl };
             successMessage = 'Background updated';
        } else {
            toast({ title: 'Not implemented', description: 'Adding props is not yet supported.'});
            return;
        }

        const updatedScenes = selectedProject.scenes.map(s => s.id === updatedScene!.id ? updatedScene : s);

        try {
            await ProjectService.updateProject(db, auth, selectedProjectId, { scenes: updatedScenes });
            toast({ title: successMessage });
        } catch(e: any) {
            toast({ title: 'Failed to update scene', description: e.message, variant: 'destructive' });
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Loading Project...</p>
            </div>
        );
    }
    
    if (!selectedProject) {
        return (
             <div className="flex h-full w-full items-center justify-center p-8">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit">
                            <FolderKanban className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-headline">Select a Project</CardTitle>
                        <CardDescription>
                           To begin, please select a project from the dropdown in the header, or create a new one in the Projects page.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const sortedScenes = selectedProject.scenes?.sort((a,b) => a.order - b.order) || [];

    return (
        <div className="flex flex-1 flex-col overflow-hidden h-full">
            <div className='flex-1 flex flex-row overflow-hidden'>
                <div className="w-[22rem] border-r bg-card hidden xl:flex h-full flex-col">
                  <AssetLibrary project={selectedProject} onAssetClick={handleAssetClick}/>
                </div>
                
                <div className="flex-1 p-4 md:p-6 lg:p-8 h-full">
                  <AnimationWorkspace scene={currentScene} />
                </div>
                
                <div className="w-[22rem] border-l bg-card hidden xl:flex h-full flex-col">
                  <ControlsPanel scene={currentScene} />
                </div>
            </div>
            <div className="border-t shrink-0">
                 <Card className="rounded-none border-x-0 border-b-0">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base">Scene Selector</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {sortedScenes.length > 0 ? (
                            <ScrollArea className="w-full whitespace-nowrap">
                                <div className="flex gap-2 pb-4">
                                {sortedScenes.map(scene => (
                                    <Button 
                                        key={scene.id} 
                                        variant={currentScene?.id === scene.id ? 'default' : 'outline'}
                                        onClick={() => setCurrentScene(scene)}
                                        className="shrink-0"
                                    >
                                        {scene.order + 1}. {scene.title}
                                    </Button>
                                ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-center text-muted-foreground">No scenes in this project. Create one in the Scene Manager.</p>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
