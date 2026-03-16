"use client";

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import { useFirebase } from '@/firebase';
import { uploadFile } from '@/lib/storage';
import type { VoiceProfile } from '@/lib/types';

import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, MicVocal, Trash2, Music, FolderKanban } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';

export default function VoiceProfileManagerPage() {
  const { userProfile, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { selectedProject, selectedProjectId, isLoading: areProjectsLoading } = useProject();
  const { db, auth, storage } = useFirebase();

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [profileToDelete, setProfileToDelete] = useState<VoiceProfile | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isUserLoading) return;

    if (userProfile && userProfile.role !== 'super_admin' && !userProfile.permissions?.voiceClone) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the Voice Clone feature.',
        variant: 'destructive',
      });
      router.replace('/guest');
    }
  }, [userProfile, isUserLoading, router, toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId || !db || !auth || !storage) {
        toast({ title: 'No project selected or Firebase not ready', description: 'Please select a project first.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const file = (formData.get('voice-sample') as File);

    if (!name || !file || file.size === 0) {
        toast({ title: "Name and voice sample are required", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        const audioUrl = await uploadFile(storage, auth, db, file, 'voice-profiles', file.name);
        
        const newProfile: Omit<VoiceProfile, 'createdAt'> & { createdAt: Date } = {
            id: `${Date.now()}`,
            name,
            audioUrl,
            createdAt: new Date(),
        };

        const updatedProfiles = [...(selectedProject?.voiceProfiles || []), newProfile];
        
        await ProjectService.updateProject(db, auth, selectedProjectId, { voiceProfiles: updatedProfiles });
        
        toast({ title: "Voice Profile Saved", description: `"${name}" has been added to your project.` });
        formRef.current?.reset();

    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete || !selectedProject || !db || !auth) return;

    setIsDeleting(true);
    try {
        const updatedProfiles = selectedProject.voiceProfiles?.filter(p => p.id !== profileToDelete.id) || [];
        await ProjectService.updateProject(db, auth, selectedProject.id, { voiceProfiles: updatedProfiles });
        toast({ title: "Profile Deleted", description: `"${profileToDelete.name}" has been removed.` });
    } catch (error: any) {
        toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setIsDeleteAlertOpen(false);
        setProfileToDelete(null);
    }
  };
  
  if (isUserLoading || !userProfile) {
    return (
      <StudioLayout>
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </StudioLayout>
    );
  }
  
  if (userProfile.role !== 'super_admin' && !userProfile.permissions?.voiceClone) {
    return (
      <StudioLayout>
        <div className="flex h-full w-full items-center justify-center">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>Module ready, but you do not have permission.</CardDescription>
                </CardHeader>
            </Card>
        </div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
        <div className="space-y-8">
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <MicVocal className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-headline">Voice Profile Manager</CardTitle>
                <CardDescription>Upload voice samples to create reusable voice profiles for your projects.</CardDescription>
                </CardHeader>
            </Card>
            
            {!selectedProjectId ? (
                 <Card className="w-full max-w-lg mx-auto text-center">
                     <CardHeader>
                        <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit">
                            <FolderKanban className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-headline">No Project Selected</CardTitle>
                        <CardDescription>
                            Please select a project from the dropdown in the header to manage its voice profiles.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
              <>
                <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Add New Voice Profile to "{selectedProject?.title}"</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Voice Profile Name</Label>
                            <Input id="name" name="name" placeholder="e.g., 'Hero Voice', 'Narrator'" required disabled={isLoading} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="voice-sample">Voice Sample (MP3/WAV)</Label>
                            <Input id="voice-sample" name="voice-sample" type="file" required disabled={isLoading} accept="audio/mp3,audio/wav,audio/mpeg" ref={fileInputRef}/>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || !selectedProjectId}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Save Voice Profile'}
                        </Button>
                    </form>
                    </CardContent>
                </Card>

                {selectedProject && (
                    <Card className="w-full max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Saved Voice Profiles for "{selectedProject.title}"</CardTitle>
                            <CardDescription>These are the custom voices available for this project.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedProject.voiceProfiles && selectedProject.voiceProfiles.length > 0 ? (
                                <ul className="space-y-3">
                                    {selectedProject.voiceProfiles.map(profile => (
                                        <li key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-4">
                                                <Music className="h-5 w-5 text-primary" />
                                                <div>
                                                    <p className="font-semibold">{profile.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Added on {format(profile.createdAt.toDate(), 'PP')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <audio controls src={profile.audioUrl} className="h-8 max-w-xs"></audio>
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setProfileToDelete(profile);
                                                    setIsDeleteAlertOpen(true);
                                                }}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No voice profiles saved for this project yet.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </>
            )}
        </div>


        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the voice profile <span className="font-bold">"{profileToDelete?.name}"</span>. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProfileToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="animate-spin" /> : "Yes, delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </StudioLayout>
  );
}
