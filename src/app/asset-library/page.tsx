'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import type {
  Project,
  Character,
  Scene,
  VoiceProfile,
  EpisodeGeneration,
  VideoGeneration,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { downloadJson } from '@/lib/utils';
import { useFirebase } from '@/firebase';

import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Trash2,
  Library,
  User,
  Clapperboard,
  MicVocal,
  BookCopy,
  Film,
  Box,
  Download,
  FolderKanban,
  SendToBack,
} from 'lucide-react';
import Image from 'next/image';

type DeletableAsset =
  | { type: 'character'; item: Character }
  | { type: 'scene'; item: Scene }
  | { type: 'voiceProfile'; item: VoiceProfile }
  | { type: 'episodeGeneration'; item: EpisodeGeneration }
  | { type: 'videoGeneration'; item: VideoGeneration };

export default function AssetLibraryPage() {
  const { toast } = useToast();
  const {
    selectedProject,
    isLoading: areProjectsLoading,
  } = useProject();
  const { db, auth } = useFirebase();

  const [isLoading, setIsLoading] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<DeletableAsset | null>(
    null
  );
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [usageWarning, setUsageWarning] = useState('');

  const handleExportMetadata = () => {
    if (!selectedProject) {
      toast({ title: 'No project selected', variant: 'destructive' });
      return;
    }

    const metadata = {
      projectName: selectedProject.title,
      exportDate: new Date().toISOString(),
      characters: selectedProject.characters?.map((c) => ({
        name: c.name,
        traits: c.traits,
        style: c.style,
        createdAt: c.createdAt.toDate(),
      })),
      scenes: selectedProject.scenes?.map((s) => ({
        title: s.title,
        description: s.description,
        order: s.order,
        background: s.background,
      })),
      voiceProfiles: selectedProject.voiceProfiles?.map((vp) => ({
        name: vp.name,
        audioUrl: vp.audioUrl,
        createdAt: vp.createdAt.toDate(),
      })),
      episodes: selectedProject.episodes,
      videoGenerations: selectedProject.videoGenerations?.map((v) => ({
        prompt: v.prompt,
        style: v.style,
        duration: v.duration,
        generatedAt: v.generatedAt.toDate(),
      })),
    };

    const filename = `${selectedProject.title.replace(
      /\s+/g,
      '-'
    )}-asset-metadata.json`;
    downloadJson(metadata, filename);
    toast({ title: 'Metadata Exported', description: `Downloaded ${filename}` });
  };
  
  const handleOpenDeleteDialog = (asset: DeletableAsset) => {
    const isUsed = selectedProject?.timeline?.some(track => 
        track.assets.some(a => a.assetId === asset.item.id)
    );

    if (isUsed) {
        setUsageWarning("This asset is used in a timeline. Deleting it may break your project.");
    } else {
        setUsageWarning("");
    }
    setAssetToDelete(asset);
    setIsDeleteAlertOpen(true);
  };

  const handleSendToTimeline = (asset: DeletableAsset) => {
    const assetName = 'name' in asset.item ? asset.item.name : 'title' in asset.item ? asset.item.title : asset.item.id;
    toast({
        title: "Sent to Timeline (Simulation)",
        description: `"${assetName}" has been added to the timeline.`,
    });
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete || !selectedProject || !db || !auth) return;

    setIsLoading(true);
    try {
      let updatedProjectData: Partial<Project> = {};
      let assetName = 'Asset';

      switch (assetToDelete.type) {
        case 'character':
          updatedProjectData.characters = selectedProject.characters?.filter(
            (c) => c.id !== assetToDelete.item.id
          );
          assetName = `character "${assetToDelete.item.name}"`;
          break;
        case 'scene':
          updatedProjectData.scenes = selectedProject.scenes
            ?.filter((s) => s.id !== assetToDelete.item.id)
            .sort((a, b) => a.order - b.order)
            .map((s, index) => ({ ...s, order: index }));
          assetName = `scene "${assetToDelete.item.title}"`;
          break;
        case 'voiceProfile':
          updatedProjectData.voiceProfiles =
            selectedProject.voiceProfiles?.filter(
              (vp) => vp.id !== assetToDelete.item.id
            );
          assetName = `voice profile "${assetToDelete.item.name}"`;
          break;
        case 'episodeGeneration':
          updatedProjectData.episodes = selectedProject.episodes?.filter(
            (e) => e.id !== assetToDelete.item.id
          );
          assetName = `episode list from ${format(
            assetToDelete.item.generatedAt.toDate(),
            'PP'
          )}`;
          break;
        case 'videoGeneration':
          updatedProjectData.videoGenerations =
            selectedProject.videoGenerations?.filter(
              (v) => v.id !== assetToDelete.item.id
            );
          assetName = `video generation from ${format(
            assetToDelete.item.generatedAt.toDate(),
            'PP'
          )}`;
          break;
      }

      await ProjectService.updateProject(
        db,
        auth,
        selectedProject.id,
        updatedProjectData
      );
      toast({
        title: 'Asset Deleted',
        description: `Successfully deleted ${assetName}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDeleteAlertOpen(false);
      setAssetToDelete(null);
    }
  };

  const renderEmptyState = (assetType: string) => (
    <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg mt-4">
      <Box className="mx-auto h-12 w-12" />
      <h3 className="mt-4 text-lg font-semibold">No {assetType} Yet</h3>
      <p>This project doesn't have any {assetType.toLowerCase()}.</p>
    </div>
  );

  return (
    <StudioLayout>
      <div className="space-y-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Library className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">
              Asset Library
            </CardTitle>
            <CardDescription>
              View and manage all assets associated with your projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Select a project from the header to view its assets.
            </p>
            <Button
              onClick={handleExportMetadata}
              disabled={!selectedProject || isLoading}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2" /> Export Project Metadata
            </Button>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <Card className="w-full max-w-lg mx-auto text-center">
            <CardHeader>
              <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit">
                <FolderKanban className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4 text-2xl font-headline">
                No Project Selected
              </CardTitle>
              <CardDescription>
                Please select a project from the dropdown in the header to see
                its assets.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Tabs defaultValue="characters">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="characters">
                <User className="mr-2" />
                Characters
              </TabsTrigger>
              <TabsTrigger value="scenes">
                <Clapperboard className="mr-2" />
                Scenes
              </TabsTrigger>
              <TabsTrigger value="voices">
                <MicVocal className="mr-2" />
                Voices
              </TabsTrigger>
              <TabsTrigger value="scripts">
                <BookCopy className="mr-2" />
                Scripts
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Film className="mr-2" />
                Videos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="characters">
              {selectedProject.characters &&
              selectedProject.characters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {selectedProject.characters.map((char) => (
                    <Card key={char.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          <span>{char.name}</span>
                          <div className="flex -mr-2 -mt-2">
                              <Button variant="ghost" size="icon" onClick={() => handleSendToTimeline({type: 'character', item: char})}>
                                  <SendToBack className="text-primary h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog({type: 'character', item: char})}>
                                  <Trash2 className="text-destructive h-4 w-4" />
                              </Button>
                          </div>
                        </CardTitle>
                        <CardDescription>
                          Created: {format(char.createdAt.toDate(), 'PP')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>
                          <span className="font-semibold">Traits:</span>{' '}
                          {char.traits}
                        </p>
                        <p>
                          <span className="font-semibold">Style:</span>{' '}
                          {char.style}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                renderEmptyState('Characters')
              )}
            </TabsContent>

            <TabsContent value="scenes">
              {selectedProject.scenes && selectedProject.scenes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {selectedProject.scenes
                    .sort((a, b) => a.order - b.order)
                    .map((scene) => (
                      <Card key={scene.id}>
                        <div className="relative">
                          <Image
                            src={scene.background}
                            alt={scene.title}
                            width={400}
                            height={225}
                            className="rounded-t-lg object-cover aspect-video"
                          />
                           <div className="absolute top-2 right-2 flex bg-black/30 rounded-md">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-primary" onClick={() => handleSendToTimeline({type: 'scene', item: scene})}>
                                    <SendToBack className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-destructive" onClick={() => handleOpenDeleteDialog({type: 'scene', item: scene})}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <CardHeader>
                          <CardTitle>{scene.title}</CardTitle>
                          <CardDescription>
                            Order: {scene.order + 1}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{scene.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                renderEmptyState('Scenes')
              )}
            </TabsContent>

            <TabsContent value="voices">
              {selectedProject.voiceProfiles &&
              selectedProject.voiceProfiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {selectedProject.voiceProfiles.map((profile) => (
                    <Card key={profile.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          <span>{profile.name}</span>
                          <div className="flex -mr-2 -mt-2">
                                <Button variant="ghost" size="icon" onClick={() => handleSendToTimeline({ type: 'voiceProfile', item: profile })}>
                                    <SendToBack className="text-primary h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog({ type: 'voiceProfile', item: profile })}>
                                    <Trash2 className="text-destructive h-4 w-4" />
                                </Button>
                            </div>
                        </CardTitle>
                        <CardDescription>
                          Added: {format(profile.createdAt.toDate(), 'PP')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <audio
                          controls
                          src={profile.audioUrl}
                          className="w-full h-10"
                        ></audio>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                renderEmptyState('Voice Profiles')
              )}
            </TabsContent>

            <TabsContent value="scripts">
              {selectedProject.episodes &&
              selectedProject.episodes.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {selectedProject.episodes.map((gen) => (
                    <Card key={gen.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          <span>{gen.episodes.length}-Episode List</span>
                            <div className="flex -mr-2 -mt-2">
                                <Button variant="ghost" size="icon" onClick={() => handleSendToTimeline({ type: 'episodeGeneration', item: gen })}>
                                    <SendToBack className="text-primary h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog({ type: 'episodeGeneration', item: gen })}>
                                    <Trash2 className="text-destructive h-4 w-4" />
                                </Button>
                            </div>
                        </CardTitle>
                        <CardDescription>
                          Generated on {format(gen.generatedAt.toDate(), 'PPpp')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-decimal list-inside text-sm space-y-1">
                          {gen.episodes.map((ep) => (
                            <li key={ep.episode}>
                              <b>Ep {ep.episode}:</b> {ep.title}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                renderEmptyState('Scripts / Episode Lists')
              )}
            </TabsContent>

            <TabsContent value="videos">
              {selectedProject.videoGenerations &&
              selectedProject.videoGenerations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {selectedProject.videoGenerations.map((video) => (
                    <Card key={video.id}>
                      <div className="relative">
                        <video
                          src={video.videoUrl}
                          controls
                          loop
                          className="rounded-t-lg w-full aspect-video bg-black"
                        />
                        <div className="absolute top-2 right-2 flex bg-black/30 rounded-md">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-primary" onClick={() => handleSendToTimeline({ type: 'videoGeneration', item: video })}>
                                <SendToBack className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-destructive" onClick={() => handleOpenDeleteDialog({ type: 'videoGeneration', item: video })}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="truncate text-base">
                          {video.prompt}
                        </CardTitle>
                        <CardDescription>
                          Generated on {format(video.generatedAt.toDate(), 'PP')}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                renderEmptyState('Generated Videos')
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {usageWarning && <p className="mb-2 font-bold text-destructive">{usageWarning}</p>}
              This action cannot be undone. This will permanently delete the
              selected asset from this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLoading}
              onClick={() => setAssetToDelete(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAsset}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Yes, delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudioLayout>
  );
}
