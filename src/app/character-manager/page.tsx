'use client';

import { useState } from 'react';
import type { Project, Character } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import { useFirebase } from '@/firebase';

import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Loader2, Users, Trash2, Edit, UserPlus, MicVocal, Palette, FolderKanban } from 'lucide-react';

export default function CharacterManagerPage() {
  const { toast } = useToast();
  const { selectedProject, selectedProjectId, isLoading: areProjectsLoading } = useProject();
  const { db, auth } = useFirebase();

  const [isLoading, setIsLoading] = useState(false);

  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleAddNewCharacter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId || !selectedProject || !db || !auth) {
        toast({ title: 'No project selected or Firebase not ready', description: 'Please select a project first.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const traits = formData.get('traits') as string;
    const style = formData.get('style') as string;
    const costumesRaw = formData.get('costumes') as string;
    const voiceProfileIdValue = formData.get('voiceProfileId') as string;

    if (!name || !traits || !style) {
        toast({ title: "Name, traits, and style are required", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        const costumes = costumesRaw ? costumesRaw.split('\n').map(c => c.trim()).filter(Boolean) : [];
        const voiceProfileId = voiceProfileIdValue === 'none' ? undefined : (voiceProfileIdValue || undefined);
        const newCharacter: Omit<Character, 'createdAt' | 'id'> & { id: string; createdAt: Date } = {
            id: `${Date.now()}`,
            name,
            traits,
            style,
            costumes,
            voiceProfileId: voiceProfileId,
            createdAt: new Date(),
        };

        const updatedCharacters = [...(selectedProject.characters || []), newCharacter];
        
        await ProjectService.updateProject(db, auth, selectedProjectId, { characters: updatedCharacters });
        
        toast({ title: "Character Saved", description: `"${name}" has been added to your project.` });
        (event.target as HTMLFormElement).reset();

    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateCharacter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!characterToEdit || !selectedProject || !db || !auth) return;
    
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('edit-name') as string;
    const traits = formData.get('edit-traits') as string;
    const style = formData.get('edit-style') as string;
    const costumesRaw = formData.get('edit-costumes') as string;
    const voiceProfileIdValue = formData.get('edit-voiceProfileId') as string;

    const costumes = costumesRaw ? costumesRaw.split('\n').map(c => c.trim()).filter(Boolean) : [];
    const voiceProfileId = voiceProfileIdValue === 'none' ? undefined : (voiceProfileIdValue || undefined);

    const updatedCharacters = selectedProject.characters?.map(c => 
        c.id === characterToEdit.id ? { ...c, name, traits, style, costumes, voiceProfileId: voiceProfileId } : c
    ) || [];

    try {
        await ProjectService.updateProject(db, auth, selectedProject.id, { characters: updatedCharacters });
        toast({ title: "Character Updated", description: `"${name}" has been updated.` });
        setIsEditModalOpen(false);
        setCharacterToEdit(null);
    } catch (error: any) {
        toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }

  const handleDeleteCharacter = async () => {
    if (!characterToDelete || !selectedProject || !db || !auth) return;

    setIsLoading(true);

    const updatedCharacters = selectedProject.characters?.filter(c => c.id !== characterToDelete.id) || [];
    
    try {
        await ProjectService.updateProject(db, auth, selectedProject.id, { characters: updatedCharacters });
        toast({ title: "Character Deleted", description: `"${characterToDelete.name}" has been removed.` });
    } catch(error: any) {
        toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
        setIsDeleteAlertOpen(false);
        setCharacterToDelete(null);
    }
  };

  return (
    <StudioLayout>
        <div className="space-y-8">
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-headline">Character Manager</CardTitle>
                <CardDescription>Create, edit, and manage the characters for your projects.</CardDescription>
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
                            Please select a project from the dropdown in the header to manage its characters.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
              <>
                <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserPlus /> Add New Character to "{selectedProject.title}"</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddNewCharacter} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Character Name</Label>
                                <Input id="name" name="name" placeholder="e.g., 'Captain Eva'" required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="traits">Traits & Backstory</Label>
                                <Textarea id="traits" name="traits" placeholder="e.g., 'A cynical but brilliant spaceship pilot haunted by a past mistake...'" required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="style">Visual Style Memory (Image URL)</Label>
                                <Input id="style" name="style" placeholder="e.g., 'https://your-image-host.com/image.png'" required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="costumes" className="flex items-center gap-2"><Palette/>Costume Variants (one per line)</Label>
                                <Textarea id="costumes" name="costumes" placeholder="e.g., 'Formal Attire'
'Casual Outfit'
'Battle Armor'" disabled={isLoading} rows={3}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voiceProfileId" className="flex items-center gap-2"><MicVocal/>Voice Profile</Label>
                                <Select name="voiceProfileId" defaultValue="none">
                                    <SelectTrigger id="voiceProfileId" disabled={isLoading}>
                                        <SelectValue placeholder="Select a voice profile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {selectedProject?.voiceProfiles?.map(vp => (
                                            <SelectItem key={vp.id} value={vp.id}>{vp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Add Character to Project'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="w-full max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Character List for "{selectedProject.title}"</CardTitle>
                        <CardDescription>These are the characters available for this project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedProject.characters && selectedProject.characters.length > 0 ? (
                            <div className="space-y-4">
                                {selectedProject.characters.map(character => (
                                    <Card key={character.id} className="p-4 flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <h3 className="font-bold text-lg">{character.name}</h3>
                                            <p className="text-sm text-muted-foreground"><span className="font-semibold">Traits:</span> {character.traits}</p>
                                            <p className="text-sm text-muted-foreground"><span className="font-semibold">Style:</span> {character.style}</p>
                                             {character.costumes && character.costumes.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold text-muted-foreground">Costumes:</p>
                                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                        {character.costumes.map((costume, i) => <li key={i}>{costume}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {character.voiceProfileId && (
                                                <p className="text-sm text-muted-foreground">
                                                    <span className="font-semibold">Voice:</span> {selectedProject?.voiceProfiles?.find(vp => vp.id === character.voiceProfileId)?.name || 'N/A'}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground pt-2">
                                                Created on {character.createdAt ? format(character.createdAt.toDate(), 'PP') : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => { setCharacterToEdit(character); setIsEditModalOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setCharacterToDelete(character); setIsDeleteAlertOpen(true); }}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No characters created for this project yet.</p>
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
                    <DialogTitle>Edit Character: {characterToEdit?.name}</DialogTitle>
                    <DialogDescription>
                    Update the details for your character.
                    </DialogDescription>
                </DialogHeader>
                 <form id="edit-character-form" onSubmit={handleUpdateCharacter} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Character Name</Label>
                        <Input id="edit-name" name="edit-name" defaultValue={characterToEdit?.name} required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-traits">Traits & Backstory</Label>
                        <Textarea id="edit-traits" name="edit-traits" defaultValue={characterToEdit?.traits} required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-style">Visual Style Memory (Image URL)</Label>
                        <Input id="edit-style" name="edit-style" defaultValue={characterToEdit?.style} required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="edit-costumes" className="flex items-center gap-2"><Palette/>Costume Variants (one per line)</Label>
                        <Textarea id="edit-costumes" name="edit-costumes" defaultValue={characterToEdit?.costumes?.join('\n')} placeholder="e.g., 'Formal Attire'
...etc" disabled={isLoading} rows={3}/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-voiceProfileId" className="flex items-center gap-2"><MicVocal/>Voice Profile</Label>
                        <Select name="edit-voiceProfileId" defaultValue={characterToEdit?.voiceProfileId || 'none'}>
                            <SelectTrigger id="edit-voiceProfileId" disabled={isLoading}>
                                <SelectValue placeholder="Select a voice profile" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {selectedProject?.voiceProfiles?.map(vp => (
                                    <SelectItem key={vp.id} value={vp.id}>{vp.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isLoading}>
                        Cancel
                    </Button>
                    </DialogClose>
                    <Button type="submit" form="edit-character-form" disabled={isLoading}>
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
                        This action cannot be undone. This will permanently delete the character <span className="font-bold">"{characterToDelete?.name}"</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCharacterToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCharacter} className="bg-destructive hover:bg-destructive/90" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Yes, delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </StudioLayout>
  );
}
