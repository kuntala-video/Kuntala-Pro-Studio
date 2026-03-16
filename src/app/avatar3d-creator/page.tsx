
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StudioLayout } from '@/components/studio-layout';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import { db, auth } from '@/lib/firebase';
import type { Character } from '@/lib/types';
import { uploadFile } from '@/lib/storage';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';


export default function Avatar3DCreatorPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const { toast } = useToast();

    const { selectedProject, selectedProjectId } = useProject();
    const [isSaving, setIsSaving] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    const [newCharName, setNewCharName] = useState('');
    const [newCharTraits, setNewCharTraits] = useState('');


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setAvatarImage(null);

        const formData = new FormData(event.currentTarget);
        const description = formData.get('description') as string;

        if (!description) {
            toast({ title: "Description is required", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/generate-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to generate avatar');
            }
            const data = await res.json();
            setAvatarImage(data.imageDataUri);
            toast({ title: 'Avatar Generated Successfully' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToProject = async () => {
        if (!selectedProjectId || !newCharName.trim() || !newCharTraits.trim() || !avatarImage) {
            toast({ title: "Missing Information", description: "Project, name, and traits are required.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(avatarImage);
            const blob = await res.blob();
            const imageUrl = await uploadFile(blob, 'character-avatars', `${newCharName.replace(/\s+/g, '-')}-${Date.now()}.png`);

            if (!selectedProject) throw new Error("Project not found");

            const newCharacter: Omit<Character, 'createdAt'> & { id: string, createdAt: Date } = {
                id: `${Date.now()}`,
                name: newCharName,
                traits: newCharTraits,
                style: imageUrl, // Use the uploaded URL as the style reference
                createdAt: new Date(),
            };

            const updatedCharacters = [...(selectedProject.characters || []), newCharacter];
            
            await ProjectService.updateProject(db, auth, selectedProjectId, { characters: updatedCharacters });
            
            toast({ title: "Character Saved!", description: `${newCharName} has been added to your project.` });
            setIsSaveDialogOpen(false);
            setNewCharName('');
            setNewCharTraits('');

        } catch (error: any) {
             toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <StudioLayout>
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-headline">AI 3D Avatar Creator</CardTitle>
                    <CardDescription>Describe your character and let AI create a 3D-style avatar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Avatar Description</Label>
                            <Input id="description" name="description" placeholder="e.g., 'A cyberpunk warrior with neon hair', 'A fantasy elf with glowing eyes'" required disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Generate Avatar'}
                        </Button>
                    </form>
                    
                    <div className="mt-6">
                        <h3 className="font-headline text-lg text-center mb-2">Generated Avatar</h3>
                        <Card className="aspect-square w-full">
                            <CardContent className="p-2 h-full">
                                {isLoading ? (
                                    <Skeleton className="w-full h-full" />
                                ) : avatarImage ? (
                                    <Image src={avatarImage} alt="Generated Avatar" width={500} height={500} className="rounded-md object-cover w-full h-full" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-center p-4">
                                        Your generated avatar will appear here.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {avatarImage && (
                            <div className="mt-4">
                                 <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full" disabled={!selectedProjectId}>
                                            <Save className="mr-2"/> Save as New Character
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Save New Character to "{selectedProject?.title}"</DialogTitle>
                                            <DialogDescription>
                                                This avatar will be saved as the visual style for a new character in your selected project.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="char-name">Character Name</Label>
                                                <Input id="char-name" value={newCharName} onChange={(e) => setNewCharName(e.target.value)} placeholder="e.g., 'Jax'" disabled={isSaving} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="char-traits">Traits & Backstory</Label>
                                                <Textarea id="char-traits" value={newCharTraits} onChange={(e) => setNewCharTraits(e.target.value)} placeholder="A brief description of the character." disabled={isSaving} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                                            <Button onClick={handleSaveToProject} disabled={isSaving || !selectedProjectId || !newCharName || !newCharTraits}>
                                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Character"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                {!selectedProjectId && <p className="text-xs text-muted-foreground text-center mt-2">Select a project in the header to save.</p>}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </StudioLayout>
    );
}
