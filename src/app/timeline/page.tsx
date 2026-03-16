'use client';

import { useState, useMemo } from 'react';
import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Play,
  Save,
  Download,
  Scissors,
  Video,
  Music,
  Mic,
  Subtitles,
  Layers,
  FileVideo,
  FileAudio,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { useProject } from '@/context/project-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { TimelineTrack, TimelineAsset } from '@/lib/types';
import { WaveformPreview } from '@/components/waveform-preview';


const totalDuration = 60; // Total timeline duration in seconds

const defaultTracks: TimelineTrack[] = [
  { id: 'track-video', name: 'Video', type: 'video', assets: [] },
  { id: 'track-audio', name: 'Music', type: 'audio', assets: [] },
  { id: 'track-voice', name: 'Voice Over', type: 'voice', assets: [] },
  { id: 'track-subtitles', name: 'Subtitles', type: 'subtitles', assets: [] },
  { id: 'track-overlay', name: 'Overlays', type: 'overlay', assets: [] },
];

const trackIconMap: Record<TimelineTrack['type'], React.ReactNode> = {
  video: <FileVideo className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  voice: <Mic className="h-4 w-4" />,
  subtitles: <Subtitles className="h-4 w-4" />,
  overlay: <Layers className="h-4 w-4" />,
};

const trackColorMap: Record<TimelineTrack['type'], string> = {
    video: 'bg-blue-500/30',
    audio: 'bg-green-500/30',
    voice: 'bg-orange-500/30',
    subtitles: 'bg-purple-500/30',
    overlay: 'bg-pink-500/30',
};


export default function TimelinePage() {
  const { selectedProject } = useProject();
  const { toast } = useToast();
  const [selectedAsset, setSelectedAsset] = useState<{trackId: string, assetId: string} | null>(null);

  const assetNameMap = useMemo(() => {
    if (!selectedProject) return new Map<string, string>();
    const map = new Map<string, string>();
    (selectedProject.scenes || []).forEach(a => map.set(a.id, a.title));
    (selectedProject.characters || []).forEach(a => map.set(a.id, a.name));
    (selectedProject.videoGenerations || []).forEach(a => map.set(a.id, a.prompt));
    (selectedProject.voiceRecordings || []).forEach(a => map.set(a.id, a.name));
    return map;
  }, [selectedProject]);

  const timelineTracks = useMemo((): TimelineTrack[] => {
    if (!selectedProject) return defaultTracks;

    const projectTimeline = selectedProject.timeline || [];
    // Merge project timeline with default tracks to ensure all tracks are present
    const mergedTracks = defaultTracks.map(defaultTrack => {
      const projectTrack = projectTimeline.find(pt => pt.type === defaultTrack.type);
      return projectTrack ? { ...defaultTrack, ...projectTrack, id: projectTrack.id || defaultTrack.id } : defaultTrack;
    });

    // Add any custom tracks from the project that aren't in the defaults
    projectTimeline.forEach(projectTrack => {
        if (!mergedTracks.some(mt => mt.type === projectTrack.type)) {
            mergedTracks.push(projectTrack);
        }
    });

    return mergedTracks;
  }, [selectedProject]);
  
  const assetDetails = useMemo(() => {
    if (!selectedAsset) return null;
    const track = timelineTracks.find(t => t.id === selectedAsset.trackId);
    if (!track) return null;
    return track.assets.find(a => a.id === selectedAsset.assetId) || null;
  }, [selectedAsset, timelineTracks]);


  return (
    <StudioLayout noPadding>
      <div className="flex h-full w-full bg-background overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-4 space-y-4 flex flex-col">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold font-headline">{selectedProject?.title || 'Timeline Editor'}</h2>
            <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">00:00 / {`${String(totalDuration).padStart(2,'0')}:00`}</span>
                <Button variant="outline" size="sm"><Save className="mr-2 h-4 w-4" /> Save</Button>
                <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
            </div>
          </div>

          {/* Preview Monitor */}
          <Card className="flex-grow flex flex-col min-h-[200px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Preview Monitor</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 bg-black rounded-b-lg flex items-center justify-center text-white">
                <Video className="w-16 h-16 text-muted-foreground"/>
            </CardContent>
          </Card>

          {/* Timeline Editor */}
          <Card className="shrink-0">
             <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Scissors/> Timeline</CardTitle>
                 <CardDescription>Drag assets from the asset library to place them on the timeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 relative overflow-x-auto">
                {(timelineTracks.length === 0 || timelineTracks.every(t => t.assets.length === 0)) ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <Plus className="h-8 w-8 mb-2"/>
                        <p className="font-semibold">Timeline is empty</p>
                        <p className="text-sm">Drag assets from the library to get started.</p>
                    </div>
                ) : (
                    timelineTracks.map(track => (
                        <div key={track.id} className="space-y-1">
                            <Label className="text-xs text-muted-foreground flex items-center gap-2">{trackIconMap[track.type]} {track.name}</Label>
                            <div className="w-full h-14 bg-muted/50 rounded-md relative group">
                                {track.assets.map(asset => {
                                    const isAudioTrack = track.type === 'audio' || track.type === 'voice';
                                    return (
                                        <div
                                            key={asset.id}
                                            className={cn(
                                                "absolute h-full p-2 border-l-2 border-r-2 flex items-center justify-between rounded-md cursor-pointer",
                                                trackColorMap[track.type],
                                                selectedAsset?.assetId === asset.id ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                                            )}
                                            style={{
                                                left: `${(asset.start / totalDuration) * 100}%`,
                                                width: `${(asset.duration / totalDuration) * 100}%`,
                                            }}
                                            onClick={() => setSelectedAsset({trackId: track.id, assetId: asset.id})}
                                        >
                                            {isAudioTrack && <WaveformPreview duration={asset.duration} />}

                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary cursor-ew-resize"></div>
                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary cursor-ew-resize"></div>

                                            <p className="text-xs font-medium truncate text-foreground z-10">{assetNameMap.get(asset.assetId) || 'Unknown Asset'}</p>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toast({ title: 'Open Source Asset (Simulation)', description: `Navigating to asset ID: ${asset.assetId}` });
                                                }}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                <span className="sr-only">Open Source Asset</span>
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar for Properties */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-card flex-shrink-0 p-4 space-y-4 overflow-y-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Properties</CardTitle>
                    <CardDescription>Select an asset on the timeline to edit its properties.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {assetDetails ? (
                        <>
                            <div className="grid gap-1">
                                <Label className="text-xs">File</Label>
                                <p className="text-sm font-semibold truncate">{assetNameMap.get(assetDetails.assetId) || 'Unknown'}</p>
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="volume">Volume</Label>
                                <Slider id="volume" defaultValue={[100]} disabled={!assetNameMap.get(assetDetails.assetId)?.match(/\.(mp3|wav)$/i)} />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="speed">Speed</Label>
                                <Slider id="speed" defaultValue={[100]} />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="opacity">Opacity</Label>
                                <Slider id="opacity" defaultValue={[100]} disabled={!!assetNameMap.get(assetDetails.assetId)?.match(/\.(mp3|wav)$/i)}/>
                            </div>
                             <div className="grid grid-cols-2 gap-2">
                                 <div className="grid gap-1">
                                    <Label htmlFor="pos-x">Position X</Label>
                                    <Input id="pos-x" type="number" defaultValue={0} disabled={!!assetNameMap.get(assetDetails.assetId)?.match(/\.(mp3|wav)$/i)}/>
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="pos-y">Position Y</Label>
                                    <Input id="pos-y" type="number" defaultValue={0} disabled={!!assetNameMap.get(assetDetails.assetId)?.match(/\.(mp3|wav)$/i)}/>
                                </div>
                             </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No asset selected.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </StudioLayout>
  );
}
