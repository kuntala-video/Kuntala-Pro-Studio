'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import { useFirebase } from '@/firebase';
import type { Scene } from '@/lib/types';

import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, GalleryHorizontal, Trash2, Edit, Film, ArrowUp, ArrowDown, FolderKanban } from 'lucide-react';
import { placeholderImages } from '@/lib/placeholder-images';

export default function SceneManagerPage() {
  const { toast } = useToast();
  const { selectedProject, selectedProjectId, isLoading: areProjectsLoading } = useProject();
  const { db, auth } = useFirebase();

  const [isLoading, setIsLoading] = useState(false);

  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [sceneToEdit, setSceneToEdit] = useState<Scene | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const sortedScenes = useMemo(() => {
    return selectedProject?.scenes?.sort((a, b) => a.order - b.order) || [];
  }, [selectedProject]);


  const handleAddNewScene = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId || !selectedProject || !db || !auth) {
        toast({ title: 'No project selected or Firebase not ready', description: 'Please select a project first.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!title || !description) {
        toast({ title: "Title and description are required", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        const defaultBackground = placeholderImages.find(img => img.category === 'background');
        
        const newScene: Scene = {
            id: `${Date.now()}`,
            title,
            description,
            order: selectedProject.scenes?.length || 0,
            background: defaultBackground?.imageUrl || 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwY2l0eXNjYXBlfGVufDB8fHx8MTc3MjQ1NTg3OXww&ixlib=rb-4.1.0&q=80&w=1080',
            characters: [],
            duration: 5
        };

        const updatedScenes = [...(selectedProject?.scenes || []), newScene];
        
        await ProjectService.updateProject(db, auth, selectedProjectId, { scenes: updatedScenes });
        
        toast({ title: "Scene Saved", description: `"${title}" has been added to your project.` });
        (event.target as HTMLFormElement).reset();

    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateScene = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sceneToEdit || !selectedProject || !db || !auth) return;
    
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const title = formData.get('edit-title') as string;
    const description = formData.get('edit-description') as string;

    const updatedScenes = selectedProject.scenes?.map(s => 
        s.id === sceneToEdit.id ? { ...s, title, description } : s
    ) || [];

     try {
        await ProjectService.updateProject(db, auth, selectedProject.id, { scenes: updatedScenes });
        toast({ title: "Scene Updated", description: `"${title}" has been updated.` });
        setIsEditModalOpen(false);
        setSceneToEdit(null);
    } catch (error: any) {
        toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }

  const handleDeleteScene = async () => {
    if (!sceneToDelete || !selectedProject || !db || !auth) return;

    setIsLoading(true);
    try {
        const updatedScenes = selectedProject.scenes?.filter(s => s.id !== sceneToDelete.id)
            .sort((a, b) => a.order - b.order)
            .map((s, index) => ({ ...s, order: index })); // Re-order remaining scenes
            
        await ProjectService.updateProject(db, auth, selectedProject.id, { scenes: updatedScenes });
        toast({ title: "Scene Deleted", description: `"${sceneToDelete.title}" has been removed.` });
    } catch (error: any) {
        toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
        setIsDeleteAlertOpen(false);
        setSceneToDelete(null);
    }
  };

  const handleReorderScene = async (sceneId: string, direction: 'up' | 'down') => {
      if (!selectedProject || !db || !auth) return;

      const scenes = [...(selectedProject.scenes || [])].sort((a, b) => a.order - b.order);
      const sceneIndex = scenes.findIndex(s => s.id === sceneId);

      if (sceneIndex === -1) return;
      if (direction === 'up' && sceneIndex === 0) return;
      if (direction === 'down' && sceneIndex === scenes.length - 1) return;

      const otherIndex = direction === 'up' ? sceneIndex - 1 : sceneIndex + 1;
      
      // Swap order property
      [scenes[sceneIndex].order, scenes[otherIndex].order] = [scenes[otherIndex].order, scenes[sceneIndex].order];

      try {
        await ProjectService.updateProject(db, auth, selectedProject.id, { scenes });
      } catch (error: any) {
        toast({ title: "Reorder Failed", description: error.message, variant: "destructive" });
      }
  };

  return (
    <StudioLayout>
        <div className="space-y-8">
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <GalleryHorizontal className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-headline">Scene Manager</CardTitle>
                    <CardDescription>Organize your project's scenes and sequence.</CardDescription>
                </CardHeader>
            </Card>

            {!selectedProject ? (
                 <Card className="w-full max-w-lg mx-auto text-center">
                     <CardHeader>
                        <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit">
                            <FolderKanban className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-headline">No Project Selected</CardTitle>
                        <CardDescription>
                            Please select a project from the dropdown in the header to manage its scenes.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
             <>
                <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Film /> Add New Scene to "{selectedProject.title}"</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddNewScene} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Scene Title</Label>
                                <Input id="title" name="title" placeholder="e.g., 'The Confrontation'" required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Scene Description</Label>
                                <Textarea id="description" name="description" placeholder="e.g., 'The hero finally faces the villain on the bridge...'" required disabled={isLoading} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Add Scene to Project'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                
                <Card className="w-full max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Scene Sequence for "{selectedProject.title}"</CardTitle>
                        <CardDescription>Scenes are ordered from top to bottom. Drag-and-drop coming soon!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sortedScenes && sortedScenes.length > 0 ? (
                            <div className="space-y-4">
                                {sortedScenes.map((scene, index) => (
                                    <Card key={scene.id} className="p-4 flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="text-xl font-bold text-muted-foreground pt-1">{scene.order + 1}</div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg">{scene.title}</h3>
                                                <p className="text-sm text-muted-foreground">{scene.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="flex flex-col">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReorderScene(scene.id, 'up')} disabled={index === 0}>
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReorderScene(scene.id, 'down')} disabled={index === sortedScenes.length - 1}>
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => { setSceneToEdit(scene); setIsEditModalOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setSceneToDelete(scene); setIsDeleteAlertOpen(true); }}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No scenes created for this project yet.</p>
                        )}
                    </CardContent>
                </Card>
            </>
            )}
        </div>
        
        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Scene: {sceneToEdit?.title}</DialogTitle>
                    <DialogDescription>
                    Update the details for your scene.
                    </DialogDescription>
                </DialogHeader>
                 <form id="edit-scene-form" onSubmit={handleUpdateScene} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-title">Scene Title</Label>
                        <Input id="edit-title" name="edit-title" defaultValue={sceneToEdit?.title} required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-description">Scene Description</Label>
                        <Textarea id="edit-description" name="edit-description" defaultValue={sceneToEdit?.description} required disabled={isLoading} />
                    </div>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isLoading}>
                        Cancel
                    </Button>
                    </DialogClose>
                    <Button type="submit" form="edit-scene-form" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the scene <span className="font-bold">"{sceneToDelete?.title}"</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSceneToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteScene} className="bg-destructive hover:bg-destructive/90" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Yes, delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </StudioLayout>
  );
}
