
'use client';

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Crown, Loader2, Wand2, FolderArchive, History, Eye, Trash2, Users, Film, Download, Hammer, FolderKanban, Video } from "lucide-react";
import { StudioLayout } from "@/components/studio-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from "@/context/project-context";
import { ProjectService } from "@/lib/projects";
import { db, auth } from '@/lib/firebase';
import type { Project, StoryIdeaGeneration, StoryIdeaGeneratorOutput, Character, Scene } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { downloadText } from "@/lib/utils";
import { placeholderImages } from "@/lib/placeholder-images";
import { DemoModal } from "@/components/demo-modal";

const genres = ["Sci-Fi", "Fantasy", "Comedy", "Drama", "Thriller", "Horror", "Adventure", "Mystery"];
const lengths = [
    { value: "short", label: "Short (1-3 Scenes)"},
    { value: "medium", label: "Medium (5-7 Scenes)"},
    { value: "long", label: "Long (10+ Scenes)"}
];

export default function MasterStudio(){
    const { toast } = useToast();
    const { selectedProject, selectedProjectId, isLoading: areProjectsLoading } = useProject();
    
    // Form state
    const [userRequest, setUserRequest] = useState("");
    const [genre, setGenre] = useState(genres[0]);
    const [length, setLength] = useState(lengths[0].value);
    
    // Generation state
    const [result, setResult] = useState<StoryIdeaGeneratorOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBuilding, setIsBuilding] = useState(false);
    
    // Project state
    const [isSaving, setIsSaving] = useState(false);

    // History state
    const [itemToDelete, setItemToDelete] = useState<StoryIdeaGeneration | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

    const generate = async() => {
        if (!userRequest) {
            toast({ title: "Topic is required", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/story",{
                method:"POST",
                headers: { 'Content-Type': 'application/json' },
                body:JSON.stringify({ userRequest, genre, length })
            });
            if (!res.ok) {
                throw new Error("Failed to generate story ideas from the API.");
            }
            const data = await res.json();
            setResult(data);
            toast({ title: "Ideas Generated", description: "You can now save these ideas to your project." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToProject = async () => {
        if (!selectedProjectId) {
            toast({ title: "No Project Selected", description: "Please select a project to save the ideas.", variant: "destructive" });
            return;
        }
        if (!result) {
             toast({ title: "No Ideas to Save", description: "Please generate some ideas first.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            if (!selectedProject) {
                throw new Error("Could not find the selected project.");
            }

            const newStoryIdeaEntry: Omit<StoryIdeaGeneration, 'generatedAt'> & { generatedAt: Date } = {
                id: `${Date.now()}`,
                generatedAt: new Date(),
                ideas: result,
            };

            const updatedStoryIdeas = [...(selectedProject.storyIdeas || []), newStoryIdeaEntry];
            
            await ProjectService.updateProject(db, auth, selectedProjectId, { storyIdeas: updatedStoryIdeas });
            
            toast({ title: "Story Ideas Saved!", description: "The ideas have been saved to your project's history." });
        } catch (error: any) {
            toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBuildProject = async () => {
        if (!selectedProject || !result) {
            toast({ title: "Cannot build project", description: "Please select a project and generate ideas first.", variant: "destructive" });
            return;
        }
        setIsBuilding(true);
        try {
            const { characterConcepts, sceneOutlines } = result;
    
            const defaultCharacterImage = placeholderImages.find(img => img.category === 'character' && img.id === 'char2');

            const newCharacters: Character[] = (characterConcepts || []).map((concept, i) => {
                const name = concept.split(',')[0].trim().split(' ').slice(0, 3).join(' ');
                return {
                    id: `char-${Date.now()}-${i}`,
                    name: name.replace(/,$/, ''),
                    traits: concept,
                    style: defaultCharacterImage?.imageUrl || 'https://images.unsplash.com/photo-1571769267292-e24dfadebbdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzcGFjZSUyMGV4cGxvcmVyfGVufDB8fHx8MTc3MjUyNzkxOXww&ixlib=rb-4.1.0&q=80&w=1080',
                    createdAt: new Date(),
                } as unknown as Character;
            });
    
            const newScenes: Scene[] = (sceneOutlines || []).map((outline, i) => {
                const titleCandidate = outline.split(': ')[0].split(' - ')[0].split('. ')[0].slice(0, 50);
                const title = titleCandidate.length < 45 ? titleCandidate : titleCandidate + '...';
                const defaultBackground = placeholderImages.find(img => img.category === 'background');
                return {
                    id: `scene-${Date.now()}-${i}`,
                    title: title,
                    description: outline,
                    order: (selectedProject.scenes?.length || 0) + i,
                    background: defaultBackground?.imageUrl || 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwY2l0eXNjYXBlfGVufDB8fHx8MTc3MjQ1NTg3OXww&ixlib=rb-4.1.0&q=80&w=1080',
                    characters: [],
                    duration: 5,
                };
            });
            
            const updatedProjectData: Partial<Project> = {
                characters: [...(selectedProject.characters || []), ...newCharacters],
                scenes: [...(selectedProject.scenes || []), ...newScenes],
            };
    
            await ProjectService.updateProject(db, auth, selectedProject.id, updatedProjectData);
    
            toast({
                title: "Project Assets Created!",
                description: `${newCharacters.length} characters and ${newScenes.length} scenes were added to your project.`
            });
    
        } catch (error: any) {
            toast({ title: "Build Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsBuilding(false);
        }
    };

    const handleExportGeneration = (generation: StoryIdeaGeneration) => {
        if (!selectedProject) return;
    
        const projectTitle = selectedProject.title.replace(/\s+/g, '-').toLowerCase();
        const generationDate = format(generation.generatedAt.toDate(), 'yyyy-MM-dd');
        const filename = `${projectTitle}-story-ideas-${generationDate}.txt`;
    
        let content = `Story Ideas for "${selectedProject.title}"\n`;
        content += `Generated on: ${format(generation.generatedAt.toDate(), 'PPpp')}\n\n`;
        
        content += `--- SUMMARY ---\n${generation.ideas.summary}\n\n`;
    
        if(generation.ideas.plotlines && generation.ideas.plotlines.length > 0) {
            content += `--- PLOTLINES ---\n`;
            content += generation.ideas.plotlines.join('\n');
            content += `\n\n`;
        }
    
        if(generation.ideas.characterConcepts && generation.ideas.characterConcepts.length > 0) {
            content += `--- CHARACTER CONCEPTS ---\n`;
            content += generation.ideas.characterConcepts.join('\n');
            content += `\n\n`;
        }
        
        if(generation.ideas.sceneOutlines && generation.ideas.sceneOutlines.length > 0) {
            content += `--- SCENE OUTLINES ---\n`;
            content += generation.ideas.sceneOutlines.join('\n');
            content += `\n\n`;
        }
    
        downloadText(content, filename);
        toast({ title: "Exported", description: `Downloaded ${filename}` });
    };

    const handleDeleteGeneration = async () => {
        if (!itemToDelete || !selectedProject) return;

        setIsSaving(true);
        try {
            const updatedStoryIdeas = selectedProject.storyIdeas?.filter(gen => gen.id !== itemToDelete.id) || [];
            await ProjectService.updateProject(db, auth, selectedProject.id, { storyIdeas: updatedStoryIdeas });
            toast({ title: "History Deleted", description: "The story ideas have been removed from your project." });
        } catch (error: any) {
            toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
            setIsDeleteAlertOpen(false);
            setItemToDelete(null);
        }
    };

    const handleViewGeneration = (generation: StoryIdeaGeneration) => {
        setResult(generation.ideas);
    };


    return(
        <StudioLayout>
            <DemoModal
                isOpen={isDemoModalOpen}
                onOpenChange={setIsDemoModalOpen}
                title="Master AI Film Studio"
                description="This is the central hub for film creation. Enter a topic, and the AI will generate story ideas, character concepts, and scene outlines. You can then save these ideas or automatically build out project assets like characters and scenes with a single click."
            />
            <div className="space-y-8">
                <Card className="w-full max-w-3xl mx-auto">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="font-headline flex items-center gap-2"><Crown className="h-6 w-6 text-primary"/>MASTER AI FILM STUDIO</CardTitle>
                                <CardDescription>The all-in-one toolkit to take your idea from script to screen.</CardDescription>
                            </div>
                            <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" size="sm">
                                <Video className="mr-2 h-4 w-4" />
                                Watch Demo
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="userRequest">Movie Topic or Idea</Label>
                                <Input
                                    id="userRequest"
                                    placeholder="e.g., 'A detective story set in a city on Mars'"
                                    value={userRequest}
                                    onChange={(e)=>setUserRequest(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="genre">Genre</Label>
                                    <Select value={genre} onValueChange={setGenre} disabled={isLoading}>
                                        <SelectTrigger id="genre"><SelectValue placeholder="Select a genre" /></SelectTrigger>
                                        <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="length">Script Length</Label>
                                    <Select value={length} onValueChange={setLength} disabled={isLoading}>
                                        <SelectTrigger id="length"><SelectValue placeholder="Select a length" /></SelectTrigger>
                                        <SelectContent>{lengths.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <Button onClick={generate} disabled={isLoading || !userRequest} className="w-full">
                            {isLoading ? <><Loader2 className="animate-spin mr-2"/> Generating...</> : <><Wand2 className="mr-2"/> Generate Ideas</>}
                            </Button>
                        </div>

                        {(result) && (
                            <div className="mt-6">
                                <h3 className="font-headline text-lg">Generated Ideas</h3>
                                <Card className="mt-2 bg-muted/50 max-h-80 overflow-y-auto">
                                    <CardContent className="p-4">
                                        <Accordion type="multiple" className="w-full" defaultValue={['summary', 'plotlines', 'characterConcepts', 'sceneOutlines']}>
                                            <AccordionItem value="summary">
                                                <AccordionTrigger>Summary</AccordionTrigger>
                                                <AccordionContent><p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p></AccordionContent>
                                            </AccordionItem>
                                            {result.plotlines && result.plotlines.length > 0 && (
                                                <AccordionItem value="plotlines">
                                                <AccordionTrigger><Wand2 className="mr-2 h-4 w-4 text-primary" />Plotlines</AccordionTrigger>
                                                <AccordionContent><ul className="list-disc pl-6 space-y-2">{result.plotlines.map((idea, index) => <li key={index}>{idea}</li>)}</ul></AccordionContent>
                                                </AccordionItem>
                                            )}
                                            {result.characterConcepts && result.characterConcepts.length > 0 && (
                                                <AccordionItem value="characterConcepts">
                                                <AccordionTrigger><Users className="mr-2 h-4 w-4 text-primary" />Character Concepts</AccordionTrigger>
                                                <AccordionContent><ul className="list-disc pl-6 space-y-2">{result.characterConcepts.map((idea, index) => <li key={index}>{idea}</li>)}</ul></AccordionContent>
                                                </AccordionItem>
                                            )}
                                            {result.sceneOutlines && result.sceneOutlines.length > 0 && (
                                                <AccordionItem value="sceneOutlines">
                                                <AccordionTrigger><Film className="mr-2 h-4 w-4 text-primary" />Scene Outlines</AccordionTrigger>
                                                <AccordionContent><ul className="list-disc pl-6 space-y-2">{result.sceneOutlines.map((idea, index) => <li key={index}>{idea}</li>)}</ul></AccordionContent>
                                                </AccordionItem>
                                            )}
                                        </Accordion>
                                    </CardContent>
                                </Card>

                                <div className="mt-4 space-y-2">
                                    <Label>Save Ideas to Project History</Label>
                                    {areProjectsLoading ? (
                                        <p className="text-sm text-muted-foreground">Loading projects...</p>
                                    ) : !selectedProjectId ? (
                                        <p className="text-sm text-muted-foreground">Select a project in the header to save.</p>
                                    ) : (
                                        <Button onClick={handleSaveToProject} disabled={isSaving} className="w-full">
                                            <FolderArchive className="mr-2" />Save to "{selectedProject?.title}"
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="mt-4">
                                    <Button onClick={handleBuildProject} disabled={isBuilding || isSaving || !selectedProjectId} className="w-full">
                                        {isBuilding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Hammer className="mr-2 h-4 w-4" />}
                                        Build Project from Ideas
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-1 text-center">This will create new character and scene assets in the selected project.</p>
                                </div>

                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {areProjectsLoading ? (
                    <div className="flex justify-center mt-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
                ) : !selectedProject ? (
                    <Card className="w-full max-w-3xl mx-auto mt-8 text-center">
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
                 <Card className="w-full max-w-3xl mx-auto mt-8">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><History/> Generation History for "{selectedProject.title}"</CardTitle>
                            <CardDescription>View or delete previously generated story ideas for this project.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {selectedProject.storyIdeas && selectedProject.storyIdeas.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full">
                                    {selectedProject.storyIdeas.sort((a, b) => b.generatedAt.toDate().getTime() - a.generatedAt.toDate().getTime()).map(generation => (
                                        <AccordionItem value={generation.id} key={generation.id}>
                                            <AccordionTrigger>Generated on {format(generation.generatedAt.toDate(), 'PPpp')}</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex justify-end gap-2 p-2 bg-muted/50 rounded-b-md">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewGeneration(generation)}><Eye className="mr-2 h-4 w-4"/>View</Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleExportGeneration(generation)}><Download className="mr-2 h-4 w-4"/>Export</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => { setItemToDelete(generation); setIsDeleteAlertOpen(true);}}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                    <History className="mx-auto h-12 w-12" />
                                    <h3 className="mt-4 text-lg font-semibold">No History Yet</h3>
                                    <p>Generated story ideas will be saved here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this set of story ideas from your project's history.</AlertDialogDescription>
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
    )
}
