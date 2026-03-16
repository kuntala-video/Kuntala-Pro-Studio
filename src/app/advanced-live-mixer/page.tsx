'use client';

import { useState, useMemo, useCallback } from 'react';
import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Camera,
  Monitor,
  Video,
  Airplay, // for Drone
  Router as RouterIcon, // for Router
  HdmiPort as Hdmi,
  Smartphone,
  LayoutGrid,
  RectangleHorizontal,
  Rows3,
  Sparkles,
  Scissors,
  Wind,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const initialSources = [
  { id: '1', type: 'camera', name: 'Main Camera' },
  { id: '2', type: 'mobile', name: 'Mobile Cam 1' },
  { id: '3', type: 'camera', name: 'Side Angle Cam' },
  { id: '4', type: 'drone', name: 'Aerial Drone' },
  { id: '5', type: 'router', name: 'Network Feed' },
  { id: '6', type: 'hdmi', name: 'External HDMI' },
  { id: '7', type: 'video_file', name: 'Media Playback' },
  { id: '8', type: 'screen', name: 'Screen Share' },
];

const transitionTypes = [
  { name: 'Cut', icon: Scissors },
  { name: 'Fade', icon: Wind },
  { name: 'Dissolve', icon: Sparkles },
  { name: 'Flash', icon: Zap },
  { name: 'Slide Left', icon: ChevronLeft },
  { name: 'Slide Right', icon: ChevronRight },
];

const durationOptions = [0.5, 1, 2];

const getSourceIcon = (type: string) => {
    switch (type) {
        case 'camera': return <Camera className="h-6 w-6" />;
        case 'screen': return <Monitor className="h-6 w-6" />;
        case 'video_file': return <Video className="h-6 w-6" />;
        case 'mobile': return <Smartphone className="h-6 w-6" />;
        case 'drone': return <Airplay className="h-6 w-6" />;
        case 'router': return <RouterIcon className="h-6 w-6" />;
        case 'hdmi': return <Hdmi className="h-6 w-6" />;
        default: return <Video className="h-6 w-6" />;
    }
}

export default function AdvancedLiveMixerPage() {
  const [sources, setSources] = useState(initialSources);
  const [programId, setProgramId] = useState('1');
  const [previewId, setPreviewId] = useState('2');
  const [layoutMode, setLayoutMode] = useState<'8-up' | '3-up' | '1-up'>('8-up');
  const [selectedTransition, setSelectedTransition] = useState('Cut');
  const [transitionDuration, setTransitionDuration] = useState(0.5);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cropSettings, setCropSettings] = useState({
    zoom: 100,
    offsetX: 0,
    offsetY: 0,
    aspectRatio: '16:9',
  });

  const programSource = useMemo(() => sources.find(s => s.id === programId), [sources, programId]);
  
  const handleSelectPreview = (id: string) => {
    if (id !== programId) {
      setPreviewId(id);
    }
  };

  const handleTransition = useCallback(() => {
    if (isTransitioning || !previewId) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setProgramId(previewId);
      const currentIndex = sources.findIndex(s => s.id === previewId);
      const nextIndex = (currentIndex + 1) % sources.length;
      if(sources[nextIndex].id !== previewId) {
          setPreviewId(sources[nextIndex].id);
      }
      setIsTransitioning(false);
    }, transitionDuration * 1000);
  }, [isTransitioning, previewId, sources, transitionDuration]);

  return (
    <StudioLayout noPadding>
      <div className="flex flex-col lg:flex-row h-full w-full bg-background overflow-hidden">
        {/* Main Content: Monitors */}
        <div className="flex-1 p-4 space-y-4 flex flex-col overflow-y-auto">
          {/* Program Monitor */}
          <Card className="flex-grow flex flex-col min-h-[300px]">
            <CardHeader className='pb-2'>
              <CardTitle className="flex items-center justify-between">
                <span>Program Output</span>
                <span className="flex items-center text-xs font-mono px-2 py-1 rounded-md bg-destructive text-destructive-foreground">LIVE</span>
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              "flex-1 bg-black rounded-b-lg flex items-center justify-center text-white relative overflow-hidden",
              isTransitioning && 'animate-pulse'
            )}>
              {programSource ? (
                <div className='text-center space-y-2'>
                  {getSourceIcon(programSource.type)}
                  <p className='font-bold text-lg'>{programSource.name}</p>
                </div>
              ) : (
                <p>No Program Selected</p>
              )}
            </CardContent>
          </Card>
          
          {/* Preview Grid */}
          <Card>
            <CardHeader className='pb-2'>
                <CardTitle>Input Previews</CardTitle>
            </CardHeader>
            <CardContent className={cn(
                "grid gap-2",
                layoutMode === '8-up' && 'grid-cols-4',
                layoutMode === '3-up' && 'grid-cols-3',
                layoutMode === '1-up' && 'grid-cols-1'
            )}>
                {sources.slice(0, layoutMode === '8-up' ? 8 : layoutMode === '3-up' ? 3 : 1).map((source, index) => (
                    <button
                        key={source.id}
                        onClick={() => handleSelectPreview(source.id)}
                        className={cn(
                            "aspect-video rounded-md p-2 flex flex-col items-center justify-center relative cursor-pointer border-2 transition-all",
                            programId === source.id ? 'bg-destructive/20 border-destructive' : 'bg-muted/50 border-transparent',
                            previewId === source.id && programId !== source.id ? 'border-primary' : '',
                            isTransitioning && (programId === source.id || previewId === source.id) ? 'animate-pulse' : ''
                        )}
                        disabled={isTransitioning}
                    >
                        <div className='text-muted-foreground'>{getSourceIcon(source.type)}</div>
                        <p className="text-xs font-semibold mt-1 truncate">{source.name}</p>
                        <div className="absolute top-1 left-1 bg-card/70 text-card-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                            {index + 1}
                        </div>
                    </button>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Controls */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-card flex-shrink-0 p-4 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader><CardTitle>Source List</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sources.map((source, index) => (
                <div key={source.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                  <span className='font-mono text-xs w-4'>{index + 1}</span>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    programId === source.id ? 'bg-destructive' : 'bg-muted',
                    previewId === source.id && 'bg-green-500',
                  )}></div>
                  <div className='text-muted-foreground'>{getSourceIcon(source.type)}</div>
                  <span className="text-sm flex-1 truncate">{source.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Layout Mode</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <Button variant={layoutMode === '1-up' ? 'default' : 'outline'} onClick={() => setLayoutMode('1-up')}><RectangleHorizontal className='h-5 w-5'/></Button>
              <Button variant={layoutMode === '3-up' ? 'default' : 'outline'} onClick={() => setLayoutMode('3-up')}><Rows3 className='h-5 w-5'/></Button>
              <Button variant={layoutMode === '8-up' ? 'default' : 'outline'} onClick={() => setLayoutMode('8-up')}><LayoutGrid className='h-5 w-5'/></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Transition FX Panel</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="text-muted-foreground">Effect</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {transitionTypes.map(t => (
                            <Button key={t.name} variant={selectedTransition === t.name ? 'default' : 'outline'} onClick={() => setSelectedTransition(t.name)} className="flex-col h-auto py-2">
                                <t.icon className="h-5 w-5 mb-1"/>
                                <span className="text-xs">{t.name}</span>
                            </Button>
                        ))}
                    </div>
                </div>
                <div>
                    <Label className="text-muted-foreground">Duration</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {durationOptions.map(d => (
                            <Button key={d} variant={transitionDuration === d ? 'default' : 'outline'} onClick={() => setTransitionDuration(d)}>
                                {d}s
                            </Button>
                        ))}
                    </div>
                </div>
                <Separator />
                <Button onClick={handleTransition} disabled={isTransitioning || !previewId} className="w-full h-14 text-xl font-bold tracking-wider">
                    TAKE
                </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Crop & Route</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                  <Label>Zoom ({cropSettings.zoom}%)</Label>
                  <Slider 
                      value={[cropSettings.zoom]} 
                      onValueChange={(val) => setCropSettings(s => ({...s, zoom: val[0]}))} 
                      min={100} 
                      max={300} 
                      step={1} 
                      disabled={!programSource || isTransitioning}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                      <Label>X-Offset</Label>
                      <Input type="number" value={cropSettings.offsetX} onChange={(e) => setCropSettings(s => ({...s, offsetX: Number(e.target.value)}))} disabled={!programSource || isTransitioning}/>
                  </div>
                  <div className="grid gap-1">
                      <Label>Y-Offset</Label>
                      <Input type="number" value={cropSettings.offsetY} onChange={(e) => setCropSettings(s => ({...s, offsetY: Number(e.target.value)}))} disabled={!programSource || isTransitioning}/>
                  </div>
              </div>
              <div>
                  <Label>Aspect Ratio</Label>
                  <Select value={cropSettings.aspectRatio} onValueChange={(val) => setCropSettings(s => ({...s, aspectRatio: val}))} disabled={!programSource || isTransitioning}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                          <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                          <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <Button className="w-full" variant="outline" disabled={!programSource || isTransitioning}>Apply Routing</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudioLayout>
  );
}
