'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import type { TextToSpeechOutput, VoiceRecording } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mic, Loader2, Download, Save, MicVocal, Play, Pause, Square, Upload, AudioLines, Settings2, Wind, Waves, Speaker, Video, SendToBack } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import { useFirebase } from '@/firebase';
import { uploadFile } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from './ui/slider';
import { DemoModal } from './demo-modal';
import { VoiceTimelineBinder } from '@/lib/voice-timeline-bind';

const ttsVoices = [
    { value: 'Algenib', label: 'English (Male)' },
    { value: 'Achernar', label: 'English (Female)' },
    { value: 'Taurus', label: 'English (Male) 2' },
    { value: 'Orion', label: 'English (Female) 2' },
    { value: 'Indus', label: 'Bengali (Female)' },
];

const proAudioSources = [
    { deviceId: 'pro-ndi', label: 'NDI Audio (Virtual)' },
    { deviceId: 'pro-usb-mixer', label: 'USB Digital Mixer' },
    { deviceId: 'pro-usb-interface', label: 'USB Audio Interface' },
    { deviceId: 'pro-ext-mixer', label: 'External Mixer Input' },
];

export function VoiceStudio() {
  const { toast } = useToast();
  const { selectedProject, selectedProjectId, refreshProjects } = useProject();
  const { db, auth, storage } = useFirebase();
  
  // Core state
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // TTS state
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState(ttsVoices[0].value);

  // Recording state
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'finished'>('idle');
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Effects state
  const [effects, setEffects] = useState({
      reverb: 0,
      echo: 0,
      noiseReduction: 0,
      gain: 1,
      vocalDepth: 50, // 0=Thin, 50=Natural, 100=Deep
  });

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  // Refs for audio processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Audio setup
  const setupAudio = useCallback(async (deviceId?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true });
      
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;

      const source = audioContext.createMediaStreamSource(stream);
      analyserNodeRef.current = audioContext.createAnalyser();
      analyserNodeRef.current.fftSize = 256;
      source.connect(analyserNodeRef.current);

      const draw = () => {
        if (analyserNodeRef.current) {
          const bufferLength = analyserNodeRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserNodeRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          setAudioLevel((avg / 255) * 100);
        }
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);
        audioChunksRef.current = [];
        setRecordingStatus('finished');
      };
      
      return stream;
    } catch (err) {
      console.error("Failed to get audio stream", err);
      toast({ title: "Microphone Access Denied", variant: "destructive" });
      return null;
    }
  }, [toast]);
  
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const audio = devices.filter(d => d.kind === 'audioinput');
      setAudioDevices(audio);
      if(audio.length > 0) setSelectedAudioDeviceId(audio[0].deviceId);
    });

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    // Only setup audio if it's a real device, not a placeholder
    if (!deviceId.startsWith('pro-')) {
        setupAudio(deviceId);
    } else {
        toast({
            title: "Input Source Selected",
            description: "Hardware integration for this source type is coming soon."
        });
    }
  };

  const startRecording = async () => {
    const stream = await setupAudio(selectedAudioDeviceId);
    if (stream && mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
      setRecordingStatus('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blob = new Blob([file], { type: file.type });
      setAudioBlob(blob);
      setAudioSrc(URL.createObjectURL(blob));
      setRecordingStatus('finished');
    }
  };

  const handleGenerateTTS = async () => {
    if (!ttsText) return toast({ title: "Text is required", variant: "destructive" });
    
    setIsLoading(true);
    setAudioSrc(null);
    setAudioBlob(null);

    try {
      const result: TextToSpeechOutput = await textToSpeech({ textToSynthesize: ttsText, voice: ttsVoice });
      if (result.audioDataUri) {
        setAudioSrc(result.audioDataUri);
        const res = await fetch(result.audioDataUri);
        const blob = await res.blob();
        setAudioBlob(blob);
        setRecordingStatus('finished');
      } else {
        throw new Error("Audio generation failed");
      }
    } catch (error) {
      toast({ title: "Audio Generation Failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!selectedProjectId || !audioBlob) return;
    if (!profileName.trim()) return toast({ title: "Profile Name Required", variant: "destructive" });

    setIsSaving(true);
    try {
        const audioUrl = await uploadFile(storage, auth, db, audioBlob, 'voice-recordings', `${profileName.replace(/\s+/g, '-')}-${Date.now()}.wav`);
        
        const newRecording: Omit<VoiceRecording, 'createdAt' | 'id'> & { id: string; createdAt: Date } = {
            id: `${Date.now()}`,
            name: profileName,
            audioUrl,
            createdAt: new Date(),
            duration: audioPlayerRef.current?.duration || 0,
        };

        const updatedRecordings = [...(selectedProject?.voiceRecordings || []), newRecording];
        await ProjectService.updateProject(db, auth, selectedProjectId, { voiceRecordings: updatedRecordings });
        
        toast({ title: "Recording Saved!" });
        refreshProjects();
        setIsSaveDialogOpen(false);
        setProfileName('');
    } catch (error: any) {
        toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleSendToTimeline = async () => {
    if (!selectedProjectId || !selectedProject) {
        toast({ title: "No Project Selected", description: "Please select a project before sending to the timeline.", variant: "destructive" });
        return;
    }
    if (!audioBlob) {
        toast({ title: "No Audio Generated", description: "Please generate or record audio first.", variant: "destructive" });
        return;
    }

    setIsSending(true);
    try {
        const recordingName = `Voice Clip ${new Date().toLocaleString()}`;
        const audioUrl = await uploadFile(storage, auth, db, audioBlob, 'voice-recordings', `${recordingName.replace(/\s+/g, '-')}-${Date.now()}.wav`);
        
        const newRecording: VoiceRecording = {
            id: `${Date.now()}`,
            name: recordingName,
            audioUrl,
            createdAt: new Date() as any,
            duration: audioPlayerRef.current?.duration || 0,
        };

        const updatedRecordings = [...(selectedProject?.voiceRecordings || []), newRecording];
        const updatedTimeline = VoiceTimelineBinder.bindVoiceToTimeline(selectedProject!, newRecording);

        await ProjectService.updateProject(db, auth, selectedProjectId, { 
            voiceRecordings: updatedRecordings,
            timeline: updatedTimeline,
        });
        
        toast({ title: "Voice sent to timeline!" });
        refreshProjects();

    } catch (error: any) {
        toast({ title: "Failed to send to timeline", description: error.message, variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

  const handleDownload = (format: 'wav' | 'mp3') => {
    if (!audioSrc) return;
    // For now, download is direct. Real conversion would happen on a server.
    const link = document.createElement("a");
    link.href = audioSrc;
    link.download = `voice-studio-output.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({title: `Downloading as ${format.toUpperCase()}`, description: `MP3 conversion is simulated.`});
  };

  const vocalDepthLabel = effects.vocalDepth < 33 ? 'Thin' : effects.vocalDepth > 66 ? 'Deep' : 'Natural';

  return (
    <>
      <DemoModal
          isOpen={isDemoModalOpen}
          onOpenChange={setIsDemoModalOpen}
          title="Voice Studio Pro"
          description="This is an enterprise-grade voice engine. Record your voice, upload audio, or use text-to-speech. Apply live effects like reverb, echo, and a special vocal depth control. Preview your work and export it to WAV or MP3, or save it directly to your project."
      />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline flex items-center gap-2">
                  <MicVocal className="text-primary" /> Voice Studio Pro
                </CardTitle>
                <CardDescription>
                  Record, process, and export professional-grade voice-overs.
                </CardDescription>
              </div>
              <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" size="sm">
                <Video className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
          </div>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-lg">1. Input Source</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="mic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="mic"><Mic/></TabsTrigger>
                  <TabsTrigger value="tts"><MicVocal/></TabsTrigger>
                  <TabsTrigger value="upload"><Upload/></TabsTrigger>
                </TabsList>
                <TabsContent value="mic" className="mt-4 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mic-select">Microphone</Label>
                    <Select value={selectedAudioDeviceId} onValueChange={handleDeviceChange} disabled={recordingStatus !== 'idle'}>
                      <SelectTrigger id="mic-select"><SelectValue placeholder="Select a microphone" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Professional Sources</SelectLabel>
                            {proAudioSources.map(d => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label}</SelectItem>)}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectLabel>Detected Devices</SelectLabel>
                            {audioDevices.map(d => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 8)}`}</SelectItem>)}
                            {audioDevices.length === 0 && <SelectItem value="no-devices" disabled>No microphones found</SelectItem>}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="h-10 w-full bg-muted rounded-md flex items-center px-2">
                        <div className="w-full bg-muted-foreground/30 h-1 rounded-full">
                           <div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${audioLevel}%` }}/>
                        </div>
                    </div>
                  {recordingStatus === 'idle' && <Button onClick={startRecording} className="w-full"><Mic className="mr-2"/>Record</Button>}
                  {recordingStatus === 'recording' && <Button onClick={stopRecording} variant="destructive" className="w-full"><Square className="mr-2"/>Stop</Button>}
                </TabsContent>
                <TabsContent value="tts" className="mt-4 space-y-4">
                  <Textarea placeholder="Enter text..." value={ttsText} onChange={e => setTtsText(e.target.value)} rows={6}/>
                  <Select value={ttsVoice} onValueChange={setTtsVoice}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{ttsVoices.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={handleGenerateTTS} disabled={isLoading || !ttsText} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin"/> : 'Generate'}
                  </Button>
                </TabsContent>
                <TabsContent value="upload" className="mt-4">
                  <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden"/>
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline"><Upload className="mr-2"/>Upload File</Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Effects Panel */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings2/> 2. Effects Engine</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-2">
                    <Label className="flex justify-between">Vocal Depth <span>({vocalDepthLabel})</span></Label>
                    <Slider value={[effects.vocalDepth]} onValueChange={v => setEffects(e => ({...e, vocalDepth: v[0]}))} />
                </div>
                 <div className="grid gap-2">
                    <Label className="flex justify-between">Reverb <span>({effects.reverb}%)</span></Label>
                    <Slider value={[effects.reverb]} onValueChange={v => setEffects(e => ({...e, reverb: v[0]}))} />
                </div>
                 <div className="grid gap-2">
                    <Label className="flex justify-between">Echo <span>({effects.echo}%)</span></Label>
                    <Slider value={[effects.echo]} onValueChange={v => setEffects(e => ({...e, echo: v[0]}))} />
                </div>
                <div className="grid gap-2">
                    <Label className="flex justify-between">Noise Removal <span>({effects.noiseReduction}%)</span></Label>
                    <Slider value={[effects.noiseReduction]} onValueChange={v => setEffects(e => ({...e, noiseReduction: v[0]}))} />
                </div>
                 <div className="grid gap-2">
                    <Label className="flex justify-between">Gain <span>({effects.gain.toFixed(1)}x)</span></Label>
                    <Slider value={[effects.gain]} onValueChange={v => setEffects(e => ({...e, gain: v[0]}))} max={3} step={0.1}/>
                </div>
            </CardContent>
          </Card>
          
          {/* Output Panel */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Speaker/> 3. Output</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="h-24 w-full bg-muted rounded-md flex items-center justify-center">
                    {audioSrc ? <audio ref={audioPlayerRef} src={audioSrc} controls className="w-full" /> : <p className="text-sm text-muted-foreground">Audio will appear here</p>}
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" onClick={() => handleDownload('wav')} disabled={!audioSrc}><Download className="mr-2"/> WAV</Button>
                    <Button variant="outline" onClick={() => handleDownload('mp3')} disabled={!audioSrc}><Download className="mr-2"/> MP3</Button>
                </div>
                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                   <DialogTrigger asChild>
                       <Button className="w-full" variant="outline" disabled={!audioSrc || !selectedProjectId}><Save className="mr-2"/> Save to Project</Button>
                   </DialogTrigger>
                    <DialogContent>
                       <DialogHeader>
                           <DialogTitle>Save Recording to "{selectedProject?.title}"</DialogTitle>
                       </DialogHeader>
                       <div className="grid gap-2 py-4">
                           <Label htmlFor="profile-name">Recording Name</Label>
                           <Input id="profile-name" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g., 'Character Intro Line'"/>
                       </div>
                       <DialogFooter>
                           <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                           <Button onClick={handleSave} disabled={isSaving || !profileName}>{isSaving ? <Loader2 className="animate-spin"/> : 'Save'}</Button>
                       </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button onClick={handleSendToTimeline} className="w-full" disabled={isSending || !audioSrc || !selectedProjectId}>
                    {isSending ? <Loader2 className="animate-spin mr-2"/> : <SendToBack className="mr-2" />} 
                    Send to Timeline
                </Button>
                {!selectedProjectId && <p className="text-xs text-center text-muted-foreground pt-1">Select a project to enable saving.</p>}
            </CardFooter>
          </Card>

        </CardContent>
      </Card>
    </>
  );
}
