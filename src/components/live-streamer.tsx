
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Radio, Video, VideoOff, XCircle, Mic, MicOff, Volume2, VolumeX, Camera, Trophy, RectangleVertical, Newspaper, PartyPopper, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { AdvertisementControls } from './advertisement-controls';
import type { AdSettings, CricketScore } from '@/lib/types';
import Image from 'next/image';
import { CricketScoreControls } from './cricket-score-controls';
import { CricketScoreOverlay } from './cricket-score-overlay';

// Filter options
const filters = [
  { name: 'None', className: '' },
  { name: 'Sepia', className: 'sepia' },
  { name: 'Grayscale', className: 'grayscale' },
  { name: 'Invert', className: 'invert' },
  { name: 'Vintage', className: 'sepia saturate-50 contrast-150' },
];

export function LiveStreamer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  const { toast } = useToast();

  // State management
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWidescreen, setIsWidescreen] = useState(false);
  const [rtmpKey, setRtmpKey] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(filters[0].className);
  const [frameOverlay, setFrameOverlay] = useState<string>('none');


  // Audio/video states
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');
  const [selectedVideoDeviceId, setSelectedVideoId] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(1);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Ad settings state
  const [adSettings, setAdSettings] = useState<AdSettings>({
    enabled: false,
    mode: 'bottom-banner',
    imageUrl: null,
    text: 'This is a sample advertisement!',
    opacity: 0.8,
  });

  // Cricket score state
  const [isCricketOverlayEnabled, setIsCricketOverlayEnabled] = useState(false);
  const [cricketScore, setCricketScore] = useState<CricketScore>({
    team1Name: 'IND',
    team2Name: 'AUS',
    innings: '1st Innings',
    overs: 18,
    balls: 4,
    runs: 180,
    wickets: 2,
    target: 210,
    runsRequired: 30,
    ballsRemaining: 8,
  });


  const setupAudioProcessing = useCallback((stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
        setAudioLevel(0);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        return;
    };

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
    }

    const source = audioContext.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    if (!gainNodeRef.current || gainNodeRef.current.context !== audioContext) {
        gainNodeRef.current = audioContext.createGain();
    }
    gainNodeRef.current.gain.value = isMuted ? 0 : micVolume;

    if (!analyserNodeRef.current || analyserNodeRef.current.context !== audioContext) {
        analyserNodeRef.current = audioContext.createAnalyser();
        analyserNodeRef.current.fftSize = 256;
    }

    source.connect(gainNodeRef.current).connect(analyserNodeRef.current);

    const draw = () => {
        if (analyserNodeRef.current) {
            const bufferLength = analyserNodeRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserNodeRef.current.getByteFrequencyData(dataArray);
            
            const sum = dataArray.reduce((a, b) => a + b, 0);
            const avg = bufferLength > 0 ? sum / bufferLength : 0;
            setAudioLevel((avg / 255) * 100);
        }
        animationFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

  }, [micVolume, isMuted]);


  const getDevicesAndStream = useCallback(async (audioId?: string, videoId?: string) => {
    try {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
            video: videoId ? { deviceId: { exact: videoId } } : true,
            audio: audioId ? { deviceId: { exact: audioId } } : true,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;

        if (videoRef.current) {
            videoRef.current.srcObject = newStream;
        }

        setHasPermission(true);
        setupAudioProcessing(newStream);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audio = devices.filter(d => d.kind === 'audioinput');
        const video = devices.filter(d => d.kind === 'videoinput');
        setAudioDevices(audio);
        setVideoDevices(video);
        
        const currentAudioTrack = newStream.getAudioTracks()[0];
        const currentVideoTrack = newStream.getVideoTracks()[0];
        if (currentAudioTrack) {
          const currentAudioId = currentAudioTrack.getSettings().deviceId;
          setSelectedAudioDeviceId(currentAudioId || '');
          if (!audioId && currentAudioId) localStorage.setItem('selectedAudioDeviceId', currentAudioId);
        }
        if (currentVideoTrack) {
          const currentVideoId = currentVideoTrack.getSettings().deviceId;
          setSelectedVideoId(currentVideoId || '');
          if (!videoId && currentVideoId) localStorage.setItem('selectedVideoId', currentVideoId);
        }
        
    } catch (error) {
        console.error('Error accessing media devices.', error);
        setHasPermission(false);
        toast({
            variant: 'destructive',
            title: 'Media Device Error',
            description: 'Could not access camera or microphone. Please check permissions.',
        });
    }
  }, [toast, setupAudioProcessing]);

  // Initial load
  useEffect(() => {
    const savedAudioId = localStorage.getItem('selectedAudioDeviceId');
    const savedVideoId = localStorage.getItem('selectedVideoId');

    getDevicesAndStream(savedAudioId ?? undefined, savedVideoId ?? undefined);
    
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
         if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle device changes
  const handleAudioDeviceChange = (deviceId: string) => {
    localStorage.setItem('selectedAudioDeviceId', deviceId);
    setSelectedAudioDeviceId(deviceId);
    getDevicesAndStream(deviceId, selectedVideoDeviceId);
  };
  
  const handleVideoDeviceChange = (deviceId: string) => {
    localStorage.setItem('selectedVideoId', deviceId);
    setSelectedVideoId(deviceId);
    getDevicesAndStream(selectedAudioDeviceId, deviceId);
  };

  // Handle volume changes
  useEffect(() => {
    if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = isMuted ? 0 : micVolume;
    }
  }, [micVolume, isMuted]);
  
  // Handle mute changes
  const handleMuteToggle = () => {
    setIsMuted(prev => !prev);
  };

  const handleStartStream = async () => {
    if (!rtmpKey) {
        toast({ title: "RTMP URL Required", description: "Please enter your full RTMP stream URL.", variant: 'destructive'});
        return;
    }
    try {
        const res = await fetch('/api/live');
        if (!res.ok) {
            throw new Error('Failed to start the live stream server.');
        }
        await res.json();
        setIsStreaming(true);
        toast({ title: "Streaming Started", description: "Connection to streaming server established (simulation)."});
    } catch (error: any) {
        toast({ title: "Stream Error", description: error.message, variant: 'destructive'});
    }
  };

  const handleStopStream = () => {
    setIsStreaming(false);
    toast({ title: "Streaming Stopped", description: "Your live stream has ended."});
  };

  const renderAdOverlay = () => {
    if (!adSettings.enabled) return null;
  
    const style = { opacity: adSettings.opacity };
  
    switch (adSettings.mode) {
      case 'bottom-banner':
        return (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white flex items-center" style={style}>
            {adSettings.imageUrl && <Image src={adSettings.imageUrl} alt="Ad Banner" width={80} height={45} className="object-contain mr-4"/>}
            <p className="flex-grow text-center">{adSettings.text}</p>
          </div>
        );
      case 'side-banner':
        return (
          <div className="absolute top-0 right-0 bottom-0 p-2 bg-black/50 w-1/4 flex flex-col justify-center items-center" style={style}>
            {adSettings.imageUrl && <Image src={adSettings.imageUrl} alt="Ad Banner" width={200} height={400} className="object-contain"/>}
          </div>
        );
      case 'image-overlay':
        return (
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none" style={style}>
            {adSettings.imageUrl && <Image src={adSettings.imageUrl} alt="Ad Overlay" width={300} height={300} className="object-contain opacity-75"/>}
          </div>
        );
      case 'text-ticker':
        return (
            <div className="absolute bottom-0 left-0 w-full bg-black/60 overflow-hidden whitespace-nowrap" style={style}>
                <p className="inline-block text-white py-1 animate-marquee">{adSettings.text}</p>
            </div>
        );
      default:
        return null;
    }
  };
  
  const renderCricketOverlay = () => {
    return <CricketScoreOverlay score={cricketScore} isVisible={isCricketOverlayEnabled} />;
  };

  const renderFrameOverlay = () => {
    if (frameOverlay === 'none' || !hasPermission) return null;

    switch (frameOverlay) {
        case 'portrait':
            return <div className="absolute inset-0 border-8 border-white pointer-events-none rounded-md" />;
        case 'news':
            return (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                    <div className="bg-red-700 text-white font-bold text-lg p-2 uppercase">LIVE</div>
                    <div className="bg-blue-900/80 text-white p-2">
                        <p className="font-bold text-xl">Breaking News</p>
                        <p className="text-sm">Sample news ticker text goes here...</p>
                    </div>
                </div>
            );
        case 'event':
            return (
                <div className="absolute inset-0 border-4 border-yellow-400 pointer-events-none rounded-md flex items-center justify-center">
                    <div className="absolute top-2 left-2 text-yellow-400"><PartyPopper/></div>
                    <div className="absolute top-2 right-2 text-yellow-400"><PartyPopper/></div>
                    <div className="absolute bottom-2 left-2 text-yellow-400"><PartyPopper/></div>
                    <div className="absolute bottom-2 right-2 text-yellow-400"><PartyPopper/></div>
                </div>
            );
        case 'ceremony':
             return (
                <div className="absolute inset-0 border-2 border-dashed border-pink-300 pointer-events-none rounded-md p-2">
                     <div className="w-full h-full border-2 border-pink-300 rounded-md"/>
                </div>
            );
        default:
            return null;
    }
  };


  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                <Radio className="text-primary" /> Live Streaming Studio
                </CardTitle>
                <CardDescription>Configure your stream and go live to your audience.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Camera Preview Section */}
                <div className="md:col-span-2">
                <Card className={cn("relative overflow-hidden transition-all bg-card", isWidescreen ? "aspect-[21/9]" : "aspect-video")}>
                    <video ref={videoRef} className={cn("w-full h-full object-cover", selectedFilter)} autoPlay muted playsInline />
                    {hasPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 text-destructive">
                        <VideoOff className="w-16 h-16" />
                        <p className="mt-4 font-semibold">Camera Access Denied</p>
                    </div>
                    )}
                    {hasPermission === null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 text-muted-foreground">
                        <Video className="w-16 h-16 animate-pulse" />
                        <p className="mt-4 font-semibold">Requesting Camera...</p>
                    </div>
                    )}
                    {renderFrameOverlay()}
                    {renderAdOverlay()}
                    {renderCricketOverlay()}
                </Card>
                {hasPermission === false && (
                    <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>Please enable camera permissions in your browser settings and refresh the page.</AlertDescription>
                    </Alert>
                )}
                </div>
            </CardContent>
        </Card>
      </div>

        {/* Controls Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="rtmp-key">RTMP URL</Label>
                <Input id="rtmp-key" type="password" placeholder="rtmp://server.com/live/your-key" value={rtmpKey} onChange={(e) => setRtmpKey(e.target.value)} disabled={isStreaming} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audio-input-select" className='flex items-center gap-2'><Mic/>Audio Input</Label>
                <Select onValueChange={handleAudioDeviceChange} value={selectedAudioDeviceId} disabled={isStreaming || !hasPermission}>
                  <SelectTrigger id="audio-input-select"><SelectValue placeholder="Select Microphone" /></SelectTrigger>
                  <SelectContent>
                    {audioDevices.map(device => <SelectItem key={device.deviceId} value={device.deviceId}>{device.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="video-input-select" className='flex items-center gap-2'><Camera/>Video Input</Label>
                <Select onValueChange={handleVideoDeviceChange} value={selectedVideoDeviceId} disabled={isStreaming || !hasPermission}>
                  <SelectTrigger id="video-input-select"><SelectValue placeholder="Select Camera" /></SelectTrigger>
                  <SelectContent>
                    {videoDevices.map(device => <SelectItem key={device.deviceId} value={device.deviceId}>{device.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Mic Volume</Label>
                <div className="flex items-center gap-2">
                  <VolumeX />
                  <Slider value={[micVolume]} onValueChange={(value) => setMicVolume(value[0])} max={2} step={0.1} disabled={isMuted || !hasPermission} />
                  <Volume2 />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Audio Level</Label>
                <Progress value={isMuted ? 0 : audioLevel} className="w-full" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="filter-select">Video Filter</Label>
                <Select
                  onValueChange={(value) => setSelectedFilter(value === 'none' ? '' : value)}
                  value={selectedFilter || 'none'}
                  disabled={!hasPermission}
                >
                    <SelectTrigger id="filter-select"><SelectValue placeholder="Select a filter" /></SelectTrigger>
                    <SelectContent>
                        {filters.map(filter => <SelectItem key={filter.name} value={filter.className || 'none'}>{filter.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="widescreen-mode">21:9 Layout</Label>
                <Switch id="widescreen-mode" checked={isWidescreen} onCheckedChange={setIsWidescreen} />
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex w-full gap-2">
                    <Button onClick={handleMuteToggle} variant={isMuted ? "destructive" : "outline"} size="icon" disabled={!hasPermission}>
                        {isMuted ? <MicOff /> : <Mic />}
                    </Button>
                    {isStreaming ? (
                        <Button onClick={handleStopStream} variant="destructive" className="w-full">Stop Stream</Button>
                    ) : (
                        <Button onClick={handleStartStream} className="w-full" disabled={!hasPermission || !rtmpKey}>Start Stream</Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground text-center">This is a UI simulation. No actual streaming will occur.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Overlays</CardTitle>
                <CardDescription>Enable or disable on-screen overlays.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                  <Label htmlFor="ad-enabled" className="flex-grow flex items-center gap-2">Live Advertisements</Label>
                  <Switch
                    id="ad-enabled"
                    checked={adSettings.enabled}
                    onCheckedChange={(checked) => setAdSettings({ ...adSettings, enabled: checked })}
                  />
                </div>
                 <div className="flex items-center justify-between">
                  <Label htmlFor="cricket-overlay-enabled" className="flex-grow flex items-center gap-2"><Trophy/> Cricket Score</Label>
                  <Switch
                    id="cricket-overlay-enabled"
                    checked={isCricketOverlayEnabled}
                    onCheckedChange={setIsCricketOverlayEnabled}
                  />
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Frame Overlays</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <Button variant={frameOverlay === 'none' ? 'default' : 'outline'} onClick={() => setFrameOverlay('none')}>None</Button>
                <Button variant={frameOverlay === 'portrait' ? 'default' : 'outline'} onClick={() => setFrameOverlay('portrait')}><RectangleVertical className="mr-2"/>Portrait</Button>
                <Button variant={frameOverlay === 'news' ? 'default' : 'outline'} onClick={() => setFrameOverlay('news')}><Newspaper className="mr-2"/>News</Button>
                <Button variant={frameOverlay === 'event' ? 'default' : 'outline'} onClick={() => setFrameOverlay('event')}><PartyPopper className="mr-2"/>Event</Button>
                <Button variant={frameOverlay === 'ceremony' ? 'default' : 'outline'} onClick={() => setFrameOverlay('ceremony')}><Heart className="mr-2"/>Ceremony</Button>
            </CardContent>
          </Card>

          <AdvertisementControls adSettings={adSettings} onAdSettingsChange={setAdSettings} />

          <CricketScoreControls score={cricketScore} onScoreChange={setCricketScore} isEnabled={isCricketOverlayEnabled} />
        </div>
    </div>
  );
}
