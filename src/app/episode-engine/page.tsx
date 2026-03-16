'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookCopy, List, FolderArchive, History, Trash2, Eye, Download, FolderKanban } from 'lucide-react';
import { StudioLayout } from '@/components/studio-layout';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import { db, auth } from '@/lib/firebase';
import type { EpisodeGeneration } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { downloadText } from '@/lib/utils';

export default function EpisodeEnginePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<any[] | null>(null);
    const { toast } = useToast();
    
    const { selectedProject, selectedProjectId, isLoading: areProjectsLoading } = useProject();

    const [itemToDelete, setItemToDelete] = useState<EpisodeGeneration | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setResult(null);

        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const total = parseInt(formData.get('total') as string, 10);

        if (!title || !total || total <= 0) {
            toast({ title: "Valid title and total episodes are required", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/episode-engine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, total }),
            });
            if (!res.ok) throw new Error('Failed to generate episodes');
            const data = await res.json();
            setResult(data);
            toast({ title: 'Episodes Generated', description: 'You can now save them to a project.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToProject = async () => {
        if (!selectedProjectId) {
            toast({ title: "No Project Selected", description: "Please select a project to save the episodes.", variant: "destructive" });
            return;
        }
        if (!result) {
             toast({ title: "No Episodes to Save", description: "Please generate an episode list first.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            if (!selectedProject) {
                throw new Error("Could not find the selected project.");
            }

            const newEpisodeEntry: Omit<EpisodeGeneration, 'generatedAt'> & { generatedAt: Date } = {
                id: `${Date.now()}`,
                generatedAt: new Date(),
                episodes: result,
            };

            const updatedEpisodes = [...(selectedProject.episodes || []), newEpisodeEntry];
            
            await ProjectService.updateProject(db, auth, selectedProjectId, { episodes: updatedEpisodes });
            
            toast({ title: "Episodes Saved!", description: "The episode list has been saved to your project's history." });
        } catch (error: any) {
            toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleExportGeneration = (generation: EpisodeGeneration) => {
        if (!selectedProject) return;

        const projectTitle = selectedProject.title.replace(/\s+/g, '-').toLowerCase();
        const generationDate = format(generation.generatedAt.toDate(), 'yyyy-MM-dd');
        const filename = `${projectTitle}-episodes-${generationDate}.txt`;

        let content = `Episode List for "${selectedProject.title}"\n`;
        content += `Generated on: ${format(generation.generatedAt.toDate(), 'PPpp')}\n\n`;
        content += generation.episodes.map(ep => `Episode ${ep.episode}: ${ep.title}`).join('\n');

        downloadText(content, filename);
        toast({ title: "Exported", description: `Downloaded ${filename}` });
    };

    const handleDeleteGeneration = async () => {
        if (!itemToDelete || !selectedProject) return;

        setIsSaving(true); // Reuse saving state for delete operation
        try {
            const updatedEpisodes = selectedProject.episodes?.filter(gen => gen.id !== itemToDelete.id) || [];
            await ProjectService.updateProject(db, auth, selectedProject.id, { episodes: updatedEpisodes });
            toast({ title: "History Deleted", description: "The episode list has been removed from your project." });
        } catch (error: any) {
            toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
            setIsDeleteAlertOpen(false);
            setItemToDelete(null);
        }
    };

    const handleViewGeneration = (generation: EpisodeGeneration) => {
        setResult(generation.episodes);
    };

    return (
        <StudioLayout>
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <BookCopy className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-headline">AI Episode Engine</CardTitle>
                    <CardDescription>Generate a list of episodes for your series from a single topic.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Series Title</Label>
                            <Input id="title" name="title" placeholder="e.g., 'The Adventures of Captain Cosmo'" required disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="total">Number of Episodes</Label>
                            <Input id="total" name="total" type="number" min="1" max="20" placeholder="e.g., 8" required disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Generate Episode List'}
                        </Button>
                    </form>

                    {result && (
                        <div className="mt-6">
                            <h3 className="font-headline text-lg mb-2">Generated Episode List</h3>
                            <Card className="mt-2 bg-muted/50 max-h-60 overflow-y-auto">
                                <CardContent className="p-4">
                                   <ul className="space-y-2">
                                        {result.map((episode: any) => (
                                            <li key={episode.episode} className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                                                <List className="h-4 w-4 text-primary" />
                                                <span className="font-semibold">Episode {episode.episode}:</span>
                                                <span>{episode.title}</span>
                                            </li>
                                        ))}
                                   </ul>
                                </CardContent>
                            </Card>
                            
                            <div className="mt-4 space-y-2">
                                <Label>Save to Project History</Label>
                                {areProjectsLoading ? (
                                    <p className="text-sm text-muted-foreground">Loading projects...</p>
                                ) : !selectedProjectId ? (
                                    <p className="text-sm text-muted-foreground">Select a project in the header to save.</p>
                                ) : (
                                    <Button onClick={handleSaveToProject} disabled={isSaving || !selectedProjectId} className="w-full">
                                        {isSaving ? <Loader2 className="animate-spin" /> : <FolderArchive />}
                                        Save to "{selectedProject?.title}"
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {areProjectsLoading ? (
                <div className="flex justify-center mt-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : !selectedProject ? (
                <Card className="w-full max-w-lg mx-auto mt-8 text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit">
                            <FolderKanban className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-headline">No Project Selected</CardTitle>
                        <CardDescription>
                           Select a project from the header to see its generation history.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Card className="w-full max-w-lg mx-auto mt-8">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><History/> Generation History for "{selectedProject.title}"</CardTitle>
                        <CardDescription>View or delete previously generated episode lists for this project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedProject.episodes && selectedProject.episodes.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full">
                                {selectedProject.episodes.sort((a, b) => b.generatedAt.toDate().getTime() - a.generatedAt.toDate().getTime()).map(generation => (
                                    <AccordionItem value={generation.id} key={generation.id}>
                                        <AccordionTrigger>
                                            Generated on {format(generation.generatedAt.toDate(), 'PPpp')} ({generation.episodes.length} episodes)
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex justify-end gap-2 p-2 bg-muted/50 rounded-b-md">
                                                <Button variant="outline" size="sm" onClick={() => handleViewGeneration(generation)}><Eye className="mr-2 h-4 w-4"/>View</Button>
                                                <Button variant="outline" size="sm" onClick={() => handleExportGeneration(generation)}><Download className="mr-2 h-4 w-4"/>Export</Button>
                                                <Button variant="destructive" size="sm" onClick={() => {
                                                    setItemToDelete(generation);
                                                    setIsDeleteAlertOpen(true);
                                                }}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                <History className="mx-auto h-12 w-12" />
                                <h3 className="mt-4 text-lg font-semibold">No History Yet</h3>
                                <p>Generated episode lists will be saved here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this episode list from your project's history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteGeneration} className="bg-destructive hover:bg-destructive/90">
                           {isSaving ? <Loader2 className="animate-spin" /> : "Yes, delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </StudioLayout>
    );
}
