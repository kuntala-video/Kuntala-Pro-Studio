'use client';

import { useState, useMemo, useEffect } from 'react';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import { useFirebase } from '@/firebase';
import type { Project, MixerSource } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, SlidersHorizontal, Trash2, Plus, ArrowUp, ArrowDown, Camera, Monitor, Video, Radio, Rss, Globe, Smartphone, Airplay, Router as RouterIcon, Hdmi, FolderKanban } from 'lucide-react';

const sourceTypes: MixerSource['type'][] = ['camera', 'screen', 'video_file', 'mobile', 'drone', 'router', 'hdmi'];

const getSourceIcon = (type: MixerSource['type']) => {
    switch (type) {
        case 'camera': return <Camera />;
        case 'screen': return <Monitor />;
        case 'video_file': return <Video />;
        case 'mobile': return <Smartphone />;
        case 'drone': return <Airplay />;
        case 'router': return <RouterIcon />;
        case 'hdmi': return <Hdmi />;
        default: return <Video />;
    }
}

export default function LiveMixerStudioPage() {
    const { toast } = useToast();
    const { db, auth } = useFirebase();
    const { projects, selectedProjectId, setSelectedProjectId, isLoading: areProjectsLoading, refreshProjects } = useProject();

    const [isSaving, setIsSaving] = useState(false);
    
    const [sourceToDelete, setSourceToDelete] = useState<MixerSource | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
    
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [selectedProjectId, projects]);

    const sources = useMemo(() => {
        return selectedProject?.mixerConfig?.sources || [];
    }, [selectedProject]);

    const activeSource = useMemo(() => {
        return sources.find(s => s.id === activeSourceId) || null;
    }, [activeSourceId, sources]);

    useEffect(() => {
        if (sources.length > 0 && !sources.some(s => s.id === activeSourceId)) {
          setActiveSourceId(sources[0].id);
        } else if (sources.length === 0) {
          setActiveSourceId(null);
        }
    }, [sources, activeSourceId]);
    
    const handleUpdateSources = async (newSources: MixerSource[]) => {
        if (!selectedProject || !db || !auth) return;

        setIsSaving(true);
        try {
            await ProjectService.updateProject(db, auth, selectedProject.id, { mixerConfig: { sources: newSources } });
            toast({ title: 'Mixer Updated', description: 'Your source list has been saved.' });
            refreshProjects(); // Refetch to get the latest state
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveNewSource = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const type = formData.get('type') as MixerSource['type'];

        if (!name || !type) {
            toast({ title: 'Missing fields', variant: 'destructive' });
            return;
        }

        if (sources.length >= 5) {
            toast({ title: 'Source Limit Reached', description: 'You can add a maximum of 5 sources.', variant: 'destructive' });
            return;
        }

        const newSource: MixerSource = { id: `${Date.now()}`, name, type };
        await handleUpdateSources([...sources, newSource]);
        setIsAddModalOpen(false);
    };

    const handleDeleteSource = async () => {
        if (!sourceToDelete) return;
        const newSources = sources.filter(s => s.id !== sourceToDelete.id);
        await handleUpdateSources(newSources);
        setSourceToDelete(null);
    };
    
    const handleReorderSource = async (sourceId: string, direction: 'up' | 'down') => {
        const index = sources.findIndex(s => s.id === sourceId);
        if (index === -1) return;
        
        const newSources = [...sources];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (newIndex < 0 || newIndex >= sources.length) return;

        [newSources[index], newSources[newIndex]] = [newSources[newIndex], newSources[index]];
        await handleUpdateSources(newSources);
    };

    if (areProjectsLoading) {
      return (
          <StudioLayout>
              <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="ml-2">Loading Projects...</p>
              </div>
          </StudioLayout>
      )
  }

    return (
        <StudioLayout>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <SlidersHorizontal className="text-primary"/> Live Broadcast Studio
                        </CardTitle>
                        <CardDescription>
                            Configure and manage the video sources for your live broadcast. Your mixer profile is saved per project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid gap-2 max-w-sm">
                            <Label htmlFor="project-select">Project</Label>
                            <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId} disabled={areProjectsLoading}>
                                <SelectTrigger id="project-select">
                                    <SelectValue placeholder={areProjectsLoading ? "Loading..." : "Select a project"}/>
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                         </div>
                    </CardContent>
                </Card>

                {!selectedProjectId ? (
                    <Card className="w-full text-center">
                        <CardHeader>
                            <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit">
                                <FolderKanban className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <CardTitle className="mt-4 text-2xl font-headline">No Project Selected</CardTitle>
                            <CardDescription>
                                Please select a project from the dropdown above to configure its live mixer.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <Card className="aspect-video relative bg-black/80 flex items-center justify-center text-muted-foreground">
                                {activeSource ? (
                                    <div className="flex flex-col items-center gap-4 text-center">
                                        <div className="bg-background/10 p-4 rounded-full">{getSourceIcon(activeSource.type)}</div>
                                        <div>
                                            <p className="font-bold">{activeSource.name}</p>
                                            <p className="text-sm">Live Preview</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p>No active source. Add one in the controller.</p>
                                )}
                                <div className="absolute top-4 left-4 bg-red-600/80 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1.5">
                                    <Radio className="h-3 w-3 animate-pulse" /> PREVIEW
                                </div>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Source Controller</CardTitle>
                                <CardDescription>Manage your 5 camera sources.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                {sources.map((source, index) => (
                                    <Card
                                        key={source.id}
                                        onClick={() => setActiveSourceId(source.id)}
                                        className={cn('p-3 flex items-center gap-3 cursor-pointer transition-all', activeSourceId === source.id && 'ring-2 ring-primary')}
                                    >
                                        <div className="text-muted-foreground">{getSourceIcon(source.type)}</div>
                                        <span className="font-medium text-sm flex-grow truncate">{source.name}</span>
                                        <div className="flex items-center">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleReorderSource(source.id, 'up')}} disabled={index === 0}> <ArrowUp/></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleReorderSource(source.id, 'down')}} disabled={index === sources.length -1}> <ArrowDown/></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSourceToDelete(source)}}><Trash2/></Button>
                                        </div>
                                    </Card>
                                ))}
                                </div>
                                {sources.length < 5 && (
                                    <Button className="w-full mt-4" variant="outline" onClick={() => setIsAddModalOpen(true)}>
                                        <Plus className="mr-2"/> Add Source
                                    </Button>
                                )}
                                {sources.length === 0 && <p className="text-sm text-center text-muted-foreground mt-4">No sources yet.</p>}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveNewSource}>
                        <DialogHeader>
                            <DialogTitle>Add New Source</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="source-name">Source Name</Label>
                                <Input id="source-name" name="name" placeholder="e.g., Main Webcam" required/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="source-type">Source Type</Label>
                                <Select name="type" required defaultValue={sourceTypes[0]}>
                                    <SelectTrigger id="source-type"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {sourceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit">Save Source</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!sourceToDelete} onOpenChange={(open) => !open && setSourceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete source "{sourceToDelete?.name}"?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogDescription>This will remove the source from your mixer profile. This cannot be undone.</AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSource} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </StudioLayout>
    );
}
