
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Youtube, FolderArchive, Film, RefreshCw, Sparkles, Wand2, Calendar as CalendarIcon, ShieldCheck, Music, FileCheck, ArrowRight, Upload, Smile, AlertTriangle, ArrowLeft, Hammer, Video as VideoIcon } from 'lucide-react';
import { StudioLayout } from '@/components/studio-layout';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProject } from '@/context/project-context';
import { ProjectService } from '@/lib/projects';
import { useFirebase } from '@/firebase/provider';
import type { VideoGeneration, ImagePlaceholder } from '@/lib/types';
import { uploadFile } from '@/lib/storage';
import { placeholderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from '@/components/ui/alert';
import { useUser } from '@/hooks/use-user';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Logo } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { DemoModal } from '@/components/demo-modal';


const videoStyles = [
  'Cinematic',
  'Anime',
  'Documentary',
  'Vlog',
  'Abstract',
  '3D Animation',
  'Stop Motion',
  'Black and White',
];

const videoDurations = [4, 5, 6, 7, 8];

const getRandomItem = (category: 'character' | 'background'): ImagePlaceholder => {
    const items = placeholderImages.filter(img => img.category === category);
    return items[Math.floor(Math.random() * items.length)];
};

type ScanCategory = {
  result: 'Low' | 'Medium' | 'High';
  details: string;
};


export default function AiVideoGeneratorPage() {
  const { toast } = useToast();
  const { selectedProject, selectedProjectId } = useProject();
  const { userProfile, isLoading: isUserLoading } = useUser();
  const { firestore: db, auth, storage } = useFirebase();
  const router = useRouter();
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  // Form state
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(videoStyles[0]);
  const [duration, setDuration] = useState(videoDurations[1]);

  // Generation state
  const [stage, setStage] = useState<'prompt' | 'background' | 'subjects' | 'dialogue' | 'voice' | 'rendering' | 'final'>('prompt');
  const [subject, setSubject] = useState<ImagePlaceholder | null>(null);
  const [secondarySubject, setSecondarySubject] = useState<ImagePlaceholder | null>(null);
  const [background, setBackground] = useState<ImagePlaceholder | null>(null);
  const [finalVideo, setFinalVideo] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState<'subject' | 'secondarySubject' | 'background' | null>(null);
  
  // Dialogue and Lip Sync state
  const [dialogue, setDialogue] = useState('');
  const [voiceAudio, setVoiceAudio] = useState<string | null>(null);
  const voiceFileInputRef = useRef<HTMLInputElement>(null);

  // Project and YouTube state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeDescription, setYoutubeDescription] = useState('');
  const [youtubeTags, setYoutubeTags] = useState<string[]>([]);
  const [publishAt, setPublishAt] = useState<Date | undefined>(undefined);

  // Pre-upload check state
  const [isPreUploadCheckVisible, setIsPreUploadCheckVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    copyright: ScanCategory;
    music: ScanCategory;
    image: ScanCategory;
    overallRisk: 'Low' | 'Medium' | 'High';
  } | null>(null);
  const [adminOverride, setAdminOverride] = useState(false);

  // Ad Editor state
  const [adSettings, setAdSettings] = useState({
    enabled: false,
    type: 'text-crawl' as 'text-crawl' | 'image-ad' | 'text-ad',
    text: 'Your promotional text here! Visit our website!',
    imageUrl: null as string | null,
    startTime: 2,
    endTime: 7,
  });
  const [isAdVisible, setIsAdVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const adImageInputRef = useRef<HTMLInputElement>(null);

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleGenerateMetadata = useCallback(async () => {
    setIsGeneratingMetadata(true);
    try {
        const res = await fetch('/api/generate-youtube-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, style }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to generate metadata');
        }
        const data = await res.json();
        setYoutubeTitle(data.title);
        setYoutubeDescription(data.description);
        setYoutubeTags(data.tags);
        toast({ title: 'YouTube Details Generated', description: 'Review and edit the details below before publishing.'});
    } catch (error: any) {
        toast({ title: 'Metadata Generation Failed', description: error.message, variant: 'destructive'});
    } finally {
        setIsGeneratingMetadata(false);
    }
  }, [prompt, style, toast]);

  useEffect(() => {
    if (isUserLoading) return;

    if (userProfile && userProfile.role !== 'super_admin' && !userProfile.permissions?.reels) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the AI Video Generator.',
        variant: 'destructive',
      });
      router.replace('/guest');
    }
  }, [userProfile, isUserLoading, router, toast]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !adSettings.enabled) {
      setIsAdVisible(false);
      return;
    }

    const handleTimeUpdate = () => {
      const isVisible = video.currentTime >= adSettings.startTime && video.currentTime <= adSettings.endTime;
      setIsAdVisible(isVisible);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    // Also check on seek
    const handleSeeked = () => handleTimeUpdate();
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [adSettings, finalVideo]);

  useEffect(() => {
    // This effect automates the metadata generation step when a video is ready.
    if (stage === 'final' && !isGeneratingMetadata && !youtubeTitle) {
      handleGenerateMetadata();
    }
  }, [stage, youtubeTitle, isGeneratingMetadata, handleGenerateMetadata]);
  
  const handleAdImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: 'Image too large', description: 'Please upload an image smaller than 2MB.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setAdSettings({ ...adSettings, imageUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateBackground = async () => {
    if (!prompt) return;
    setIsGenerating(true);

    // Reset state from any previous generation
    setFinalVideo(null);
    setYoutubeTitle('');
    setYoutubeDescription('');
    setYoutubeTags([]);
    setPublishAt(undefined);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBackground(getRandomItem('background'));
    setStage('background');
    setIsGenerating(false);
    toast({
        title: 'Scene Background Generated!',
        description: 'Review the background or continue to add subjects.'
    });
  };

  const handleGenerateSubjects = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubject(getRandomItem('character'));
    setSecondarySubject(getRandomItem('character'));
    setStage('subjects');
    setIsGenerating(false);
    toast({
        title: 'Subjects Generated!',
        description: 'Review the subjects below or proceed to add dialogue.'
    });
};

  const handleRegenerate = async (element: 'subject' | 'secondarySubject' | 'background') => {
      setRegenerating(element);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (element) {
          case 'subject':
              setSubject(getRandomItem('character'));
              break;
          case 'secondarySubject':
              setSecondarySubject(getRandomItem('character'));
              break;
          case 'background':
              setBackground(getRandomItem('background'));
              break;
      }

      setRegenerating(null);
  };
  
  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setVoiceAudio(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRenderVideo = async () => {
    if (!prompt || !subject || !background || !secondarySubject || !dialogue || !voiceAudio) {
       toast({
        title: 'Incomplete Scene',
        description: 'Please ensure prompt, scene elements, dialogue, and voice audio are all present.',
        variant: 'destructive',
      });
      return;
    }
    setStage('rendering');

    const finalPrompt = `${prompt}. A scene featuring ${subject.description} and ${secondarySubject.description} in front of a ${background.description}. One character says: "${dialogue}".`;

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt, style, duration }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await res.json();
      setFinalVideo(data.video);
      setStage('final');
      toast({
        title: 'Video Generated',
        description: 'Your video is ready. You can now save it to a project.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message,
      });
      setStage('voice'); // Go back to the voice editor on failure
    }
  };

  const handleSaveToProject = async () => {
    if (!selectedProjectId) {
      toast({ title: 'No Project Selected', variant: 'destructive' });
      return;
    }
    if (!finalVideo) {
      toast({ title: 'No Video to Save', variant: 'destructive' });
      return;
    }
    if (!storage || !auth || !db) {
        toast({ title: 'Firebase not ready', variant: 'destructive'});
        return;
    }

    setIsSaving(true);
    try {
      if (!selectedProject) {
        throw new Error('Could not find the selected project.');
      }
      
      const videoRes = await fetch(finalVideo);
      const videoBlob = await videoRes.blob();
      const videoUrl = await uploadFile(storage, auth, db, videoBlob, 'generated-videos', `video-${Date.now()}.mp4`);

      const newVideoGeneration: Omit<VideoGeneration, 'generatedAt' | 'id'> = {
        prompt,
        style,
        duration,
        videoUrl: videoUrl,
      };

      const updatedVideoGenerations = [
        ...(selectedProject.videoGenerations || []),
        { id: `${Date.now()}`, generatedAt: new Date(), ...newVideoGeneration },
      ];

      await ProjectService.updateProject(
        db, auth, selectedProjectId, { videoGenerations: updatedVideoGenerations }
      );

      toast({ title: 'Video Saved!', description: "The video has been saved to your project's history." });
    } catch (error: any) {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  
  const handlePreUploadCheck = async () => {
    setIsScanning(true);
    setScanResults(null);
    setAdminOverride(false);
    setIsPreUploadCheckVisible(true);

    // Simulate scanning
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Simulate random results for demonstration
    const risk = Math.random();
    if (risk < 0.6) { // Low risk
        setScanResults({
            copyright: { result: 'Low', details: 'No copyrighted content detected in video.' },
            music: { result: 'Low', details: 'Audio track appears to be original or licensed.' },
            image: { result: 'Low', details: 'No duplicate image sequences found in our database.' },
            overallRisk: 'Low'
        });
    } else if (risk < 0.9) { // Medium risk
        setScanResults({
            copyright: { result: 'Medium', details: 'A short, un-monetized music clip was detected. Review fair use policies.' },
            music: { result: 'Medium', details: 'Detected a 3-second audio clip matching a commercial track.' },
            image: { result: 'Low', details: 'No duplicate image sequences found in our database.' },
            overallRisk: 'Medium'
        });
    } else { // High risk
        setScanResults({
            copyright: { result: 'High', details: 'A significant portion of the audio matches a copyrighted track.' },
            music: { result: 'High', details: 'Contains protected musical content that will likely trigger a copyright claim.' },
            image: { result: 'Low', details: 'No duplicate image sequences found in our database.' },
            overallRisk: 'High'
        });
    }

    setIsScanning(false);
  };

  const uploadToYouTube = async () => {
    if (!finalVideo) {
      toast({ variant: 'destructive', title: 'No video found' });
      return;
    }
    if (!youtubeTitle) {
      toast({ variant: 'destructive', title: 'YouTube title is required.' });
      return;
    }

    setIsUploading(true);
    toast({ title: 'Uploading to YouTube...', description: 'This may take a moment.' });

    try {
      // Here you would apply the ad overlay to the video using a server-side process (e.g., FFMPEG) before uploading.
      // For this prototype, we'll skip the ad-burning step and upload the original video.
      console.log('Uploading video with ad settings (simulation):', adSettings);
      
      const videoRes = await fetch(finalVideo);
      const videoBlob = await videoRes.blob();
      const videoFile = new File([videoBlob], 'ai-generated-video.mp4', { type: videoBlob.type });

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', youtubeTitle);
      formData.append('description', youtubeDescription);
      formData.append('tags', JSON.stringify(youtubeTags)); // Send as JSON string
      if (publishAt) {
          formData.append('publishAt', publishAt.toISOString());
      }

      const uploadRes = await fetch('/api/youtube-upload', { method: 'POST', body: formData });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        if (uploadRes.status === 501) {
            throw new Error(errorData.details || 'YouTube integration is not fully configured on the server.');
        }
        throw new Error(errorData.details || errorData.error || 'Failed to upload to YouTube.');
      }

      const result = await uploadRes.json();
      const message = publishAt
        ? `Video scheduled for publish on YouTube with ID: ${result.videoId}`
        : `Video uploaded to YouTube with ID: ${result.videoId}`;
      toast({ title: 'Upload Successful!', description: message });
      setIsPreUploadCheckVisible(false);

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };
  
  const SceneElementCard = ({ title, item, onRegenerate, isRegenerating }: { title: string, item: ImagePlaceholder, onRegenerate: () => void, isRegenerating: boolean}) => (
      <Card>
          <CardHeader>
              <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="aspect-square relative mb-2">
                  <Image src={item.imageUrl} alt={item.description} fill style={{objectFit:"cover"}} className="rounded-md" />
              </div>
              <p className="text-sm text-muted-foreground text-center h-10">{item.description}</p>
          </CardContent>
          <CardFooter>
              <Button variant="outline" className="w-full" onClick={onRegenerate} disabled={isGenerating || isRegenerating}>
                  {isRegenerating ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                  Regenerate
              </Button>
          </CardFooter>
      </Card>
  )
  
  const AdOverlay = ({ settings, isVisible }: { settings: typeof adSettings, isVisible: boolean }) => {
    if (!isVisible || !settings.enabled) return null;

    if (settings.type === 'text-crawl') {
        return (
            <div className="absolute bottom-0 left-0 w-full bg-black/60 overflow-hidden whitespace-nowrap pointer-events-none">
                <p className="inline-block text-white py-2 text-lg animate-marquee">{settings.text}</p>
            </div>
        );
    }
    
    if (settings.type === 'image-ad' && settings.imageUrl) {
        return (
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none bg-black/20">
                <Image src={settings.imageUrl} alt="Ad" width={200} height={200} className="object-contain rounded-md shadow-lg" />
            </div>
        )
    }

    if (settings.type === 'text-ad') {
         return (
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                <div className="bg-black/70 text-white p-4 rounded-lg shadow-lg max-w-sm text-center">
                    <p>{settings.text}</p>
                </div>
            </div>
        )
    }

    return null;
  }

  const uploadIsBlocked = scanResults?.overallRisk === 'High' && !adminOverride;

   if (isUserLoading || !userProfile) {
    return (
      <StudioLayout>
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </StudioLayout>
    );
  }
  
  if (userProfile.role !== 'super_admin' && !userProfile.permissions?.reels) {
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
      <DemoModal
        isOpen={isDemoModalOpen}
        onOpenChange={setIsDemoModalOpen}
        title="AI Scene-to-Video Generator"
        description="This powerful tool guides you through creating a complete video scene. Start with a prompt, generate a background and subjects, add dialogue and a voiceover, and finally render your video. You can then save it to your project or publish it directly to YouTube."
      />
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center gap-2">
                <Film className="h-8 w-8 text-primary" />
                AI Scene-to-Video Generator
              </CardTitle>
              <CardDescription>
                {stage === 'final'
                  ? 'Your video is ready! Review, save, or publish to YouTube.'
                  : 'Follow the steps to generate your AI video: Script → Scene → Subjects → Dialogue → Voice → Render.'}
              </CardDescription>
            </div>
            <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" size="sm">
              <VideoIcon className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          
          {stage === 'prompt' && (
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="prompt">Script / Prompt</Label>
                <Textarea
                  id="prompt"
                  className="w-full bg-card p-4 rounded text-base"
                  placeholder="A majestic dragon soaring over a mystical forest at dawn."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  disabled={isGenerating}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="style">Style</Label>
                  <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                    <SelectTrigger id="style"><SelectValue placeholder="Select a style" /></SelectTrigger>
                    <SelectContent>{videoStyles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))} disabled={isGenerating}>
                    <SelectTrigger id="duration"><SelectValue placeholder="Select duration" /></SelectTrigger>
                    <SelectContent>{videoDurations.map((d) => <SelectItem key={d} value={String(d)}>{d} seconds</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerateBackground} disabled={isGenerating || !prompt}>
                {isGenerating ? <><Loader2 className="mr-2 animate-spin" /> Generating Scene...</> : <><Sparkles className="mr-2"/>Generate Scene</>}
              </Button>
            </div>
          )}

          {stage === 'background' && background && (
              <div className="grid gap-6">
                  <Card className="bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground"><span className="font-bold">Original Prompt:</span> {prompt}</p>
                  </Card>
                  <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-start-2">
                          <SceneElementCard title="Scene Background" item={background} onRegenerate={() => handleRegenerate('background')} isRegenerating={regenerating === 'background'} />
                      </div>
                  </div>
                  <Separator className="my-6" />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStage('prompt')} disabled={isGenerating}>
                        <ArrowLeft className="mr-2 h-4 w-4" />Back to Prompt
                    </Button>
                    <Button onClick={handleGenerateSubjects} disabled={isGenerating}>
                        {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Subjects...</> : <>Next: Add Subjects <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </div>
              </div>
          )}

          {stage === 'subjects' && subject && secondarySubject && background && (
              <div className="grid gap-6">
                  <Card className="bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground"><span className="font-bold">Original Prompt:</span> {prompt}</p>
                  </Card>
                  <div className="grid md:grid-cols-3 gap-4">
                      <SceneElementCard title="Main Subject" item={subject} onRegenerate={() => handleRegenerate('subject')} isRegenerating={regenerating === 'subject'} />
                      <SceneElementCard title="Secondary Subject" item={secondarySubject} onRegenerate={() => handleRegenerate('secondarySubject')} isRegenerating={regenerating === 'secondarySubject'} />
                      <SceneElementCard title="Background" item={background} onRegenerate={() => handleRegenerate('background')} isRegenerating={regenerating === 'background'} />
                  </div>
                  <Separator className="my-6" />
                  <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStage('background')} disabled={isGenerating}>
                          <ArrowLeft className="mr-2 h-4 w-4" />Back to Scene
                      </Button>
                      <Button onClick={() => { setDialogue(prompt); setStage('dialogue'); }} disabled={isGenerating}>
                          Next: Add Dialogue <ArrowRight className="ml-2 h-4 w-4"/>
                      </Button>
                  </div>
              </div>
          )}
          
          {stage === 'dialogue' && subject && secondarySubject && background && (
            <div className="grid gap-6">
                <Card className="bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground"><span className="font-bold">Original Prompt:</span> {prompt}</p>
                </Card>
                <div className="grid gap-2">
                    <Label htmlFor="dialogue" className="flex items-center gap-2 mb-2"><Music/> Dialogue</Label>
                    <Textarea id="dialogue" value={dialogue} onChange={(e) => setDialogue(e.target.value)} rows={8} placeholder="Enter the dialogue for your character..." />
                </div>
                
                <Separator className="my-6" />
                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStage('subjects')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />Back to Subjects
                    </Button>
                    <Button onClick={() => setStage('voice')} disabled={!dialogue}>
                        Next: Add Voice <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                </div>
            </div>
          )}

          {stage === 'voice' && (
            <div className="grid gap-6">
                <Card className="bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground"><span className="font-bold">Dialogue:</span> {dialogue}</p>
                </Card>
                <div className="grid gap-2">
                    <Label htmlFor="voice-audio" className="flex items-center gap-2 mb-2"><Upload/> Voice Audio</Label>
                    <p className="text-sm text-muted-foreground">Upload an audio file for the dialogue. This will be used for lip-syncing the character.</p>
                    <Input type="file" ref={voiceFileInputRef} onChange={handleAudioFileChange} accept="audio/*" className="hidden" />
                    <Button type="button" variant="outline" className="w-full" onClick={() => voiceFileInputRef.current?.click()}>
                        <Upload className="mr-2" /> {voiceAudio ? "Change Voice File" : "Upload Voice File"}
                    </Button>
                    {voiceAudio && <audio src={voiceAudio} controls className="w-full h-10 mt-2"/>}
                </div>

                <Separator className="my-6" />
                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStage('dialogue')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />Back to Dialogue
                    </Button>
                    <Button onClick={handleRenderVideo} disabled={!voiceAudio}>
                        <Wand2 className="mr-2 h-4 w-4"/> Render Video
                    </Button>
                </div>
            </div>
            )}


          {stage === 'rendering' && (
             <div className="text-center p-8 space-y-4">
                <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
                <h2 className="text-2xl font-semibold font-headline">Rendering Video...</h2>
                <p className="text-muted-foreground">This can take a minute or two. Please don't close this page.</p>
            </div>
          )}

          {stage === 'final' && finalVideo && (
            <div className="mt-4 grid gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                    <h2 className="text-2xl mb-4 font-semibold font-headline text-center">Generated Video</h2>
                    <div className="relative">
                        <video
                            ref={videoRef}
                            src={finalVideo}
                            controls
                            loop
                            className="w-full rounded-lg border bg-card mx-auto"
                        />
                        <AdOverlay settings={adSettings} isVisible={isAdVisible} />
                    </div>
                     <div className="space-y-2">
                        <Button onClick={handleSaveToProject} disabled={isSaving || !selectedProjectId || isUploading}>
                            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <FolderArchive className="mr-2" />}
                            Save to Project
                        </Button>
                        <Button variant="outline" onClick={() => setStage('prompt')}>Start New Video</Button>
                    </div>
                </div>

                <div className="space-y-4">
                  <Card>
                      <CardHeader>
                          <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2"><Youtube className="text-red-500" /> Publish to YouTube</CardTitle>
                              <Logo className="w-8 h-8" />
                          </div>
                          <CardDescription>Review and refine your video's details before uploading.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                            {isGeneratingMetadata ? (
                                <div className="flex items-center justify-center p-8 space-x-2 text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    <span>Generating YouTube details...</span>
                                </div>
                            ) : (
                              <div className="space-y-4 animate-in fade-in-0">
                                  <div className="grid gap-2">
                                      <Label htmlFor="youtube-title">Title</Label>
                                      <Input id="youtube-title" value={youtubeTitle} onChange={e => setYoutubeTitle(e.target.value)} placeholder="A catchy title..."/>
                                  </div>
                                  <div className="grid gap-2">
                                      <Label htmlFor="youtube-description">Description</Label>
                                      <Textarea id="youtube-description" value={youtubeDescription} onChange={e => setYoutubeDescription(e.target.value)} placeholder="A compelling description..." rows={5}/>
                                  </div>
                                  <div className="grid gap-2">
                                      <Label htmlFor="youtube-tags">Tags (comma-separated)</Label>
                                      <Input id="youtube-tags" value={youtubeTags.join(', ')} onChange={e => setYoutubeTags(e.target.value.split(',').map(t => t.trim()))} placeholder="viral, ai, animation..."/>
                                  </div>
                                  <div className="grid gap-2">
                                      <Label>Schedule Publish (Optional)</Label>
                                      <Popover>
                                          <PopoverTrigger asChild>
                                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !publishAt && "text-muted-foreground")}>
                                                  <CalendarIcon className="mr-2"/>
                                                  {publishAt ? format(publishAt, "PPP") : <span>Pick a date</span>}
                                              </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={publishAt} onSelect={setPublishAt} initialFocus /></PopoverContent>
                                      </Popover>
                                  </div>
                              </div>
                            )}
                      </CardContent>
                      <CardFooter>
                          <Button onClick={handlePreUploadCheck} className="w-full" disabled={isUploading || isGeneratingMetadata || !finalVideo || !youtubeTitle}>
                              {isUploading ? <><Loader2 className="mr-2 animate-spin" /> Publishing...</> : (publishAt ? 'Schedule Upload' : 'Upload Now')}
                          </Button>
                      </CardFooter>
                  </Card>

                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Hammer /> Ad Editor</CardTitle>
                          <CardDescription>Add a temporary ad overlay to preview before uploading.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="ad-enabled" className="flex-grow">Enable Ad Preview</Label>
                            <Switch id="ad-enabled" checked={adSettings.enabled} onCheckedChange={(checked) => setAdSettings({...adSettings, enabled: checked})} />
                          </div>
                           {adSettings.enabled && (
                            <div className="space-y-4 pt-2 animate-in fade-in-0">
                              <div className="grid gap-2">
                                <Label htmlFor="ad-type">Ad Type</Label>
                                <Select value={adSettings.type} onValueChange={(value: typeof adSettings.type) => setAdSettings({...adSettings, type: value})}>
                                  <SelectTrigger id="ad-type"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text-crawl">Text Crawl</SelectItem>
                                    <SelectItem value="image-ad">Image Ad</SelectItem>
                                    <SelectItem value="text-ad">Text Overlay</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {(adSettings.type === 'text-crawl' || adSettings.type === 'text-ad') && (
                                <div className="grid gap-2">
                                  <Label htmlFor="ad-text">Ad Text</Label>
                                  <Textarea id="ad-text" value={adSettings.text} onChange={e => setAdSettings({...adSettings, text: e.target.value})} />
                                </div>
                              )}
                              
                              {adSettings.type === 'image-ad' && (
                                <div className="grid gap-2">
                                  <Label>Ad Image</Label>
                                  <Input type="file" ref={adImageInputRef} onChange={handleAdImageUpload} accept="image/*" className="hidden"/>
                                  <Button variant="outline" onClick={() => adImageInputRef.current?.click()}><Upload className="mr-2"/> Upload Image</Button>
                                  {adSettings.imageUrl && <Image src={adSettings.imageUrl} alt="Ad Preview" width={100} height={100} className="rounded-md border object-contain"/>}
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="ad-start-time">Start Time (s)</Label>
                                  <Input id="ad-start-time" type="number" value={adSettings.startTime} onChange={e => setAdSettings({...adSettings, startTime: Number(e.target.value)})} />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="ad-end-time">End Time (s)</Label>
                                  <Input id="ad-end-time" type="number" value={adSettings.endTime} onChange={e => setAdSettings({...adSettings, endTime: Number(e.target.value)})} />
                                </div>
                              </div>
                               <Alert>
                                <UiAlertDescription>
                                  Note: This is a client-side preview. The ad will not be burned into the final uploaded video.
                                </UiAlertDescription>
                              </Alert>
                            </div>
                           )}
                      </CardContent>
                  </Card>
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isPreUploadCheckVisible} onOpenChange={(open) => { if (!open) { setIsPreUploadCheckVisible(false); setAdminOverride(false); }}}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Pre-Upload Integrity Scan</AlertDialogTitle>
                <AlertDialogDescription>
                    {isScanning ? 'Performing final checks before uploading to YouTube. This helps mitigate copyright risks.' : 'Scan complete. Please review the results below.'}
                </AlertDialogDescription>
            </AlertDialogHeader>
            {isScanning ? (
            <div className="flex items-center justify-center p-8 space-x-4 text-muted-foreground">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <span>Scanning for copyright & originality...</span>
            </div>
            ) : scanResults ? (
            <div className="space-y-4 my-4">
                {[
                    { title: 'Copyright Scan', data: scanResults.copyright },
                    { title: 'Music Originality', data: scanResults.music },
                    { title: 'Image Duplication', data: scanResults.image },
                ].map(({ title, data }) => {
                    const isHigh = data.result === 'High';
                    const isMedium = data.result === 'Medium';
                    const icon = isHigh ? <AlertTriangle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" /> :
                                isMedium ? <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" /> :
                                <ShieldCheck className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />;
                    const textColor = isHigh ? "text-destructive" : isMedium ? "text-yellow-500" : "text-green-500";
                    
                    return (
                        <div className="flex items-start gap-3" key={title}>
                            {icon}
                            <div>
                                <p className="font-semibold">{title}: <span className={cn("font-bold", textColor)}>{data.result} Risk</span></p>
                                <p className="text-sm text-muted-foreground">{data.details}</p>
                            </div>
                        </div>
                    );
                })}

                <Separator />
                
                {scanResults.overallRisk === 'High' && !adminOverride && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Upload Blocked</AlertTitle>
                        <UiAlertDescription>
                            High-risk content detected. Upload has been blocked to prevent potential copyright strikes.
                            {isAdmin && " An admin can override this action."}
                        </UiAlertDescription>
                    </Alert>
                )}
                {scanResults.overallRisk === 'Medium' && (
                    <Alert className="border-yellow-500/50">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <AlertTitle className="text-yellow-600">Potential Issues Found</AlertTitle>
                        <UiAlertDescription>
                           Medium-risk content detected. Please review the findings before proceeding. You can still upload the video.
                        </UiAlertDescription>
                    </Alert>
                )}
                 {scanResults.overallRisk === 'Low' && (
                    <Alert className="border-green-500/50">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <AlertTitle className="text-green-600">Low Risk Detected</AlertTitle>
                        <UiAlertDescription>
                           No significant issues found. You are cleared to upload.
                        </UiAlertDescription>
                    </Alert>
                )}
                {adminOverride && (
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertTitle>Admin Override Enabled</AlertTitle>
                        <UiAlertDescription>
                           You are proceeding with the upload despite the high-risk warning.
                        </UiAlertDescription>
                    </Alert>
                )}
                <Alert>
                    <UiAlertDescription>
                    This is a simulated scan. In a real-world scenario, this would integrate with content identification APIs.
                    </UiAlertDescription>
                </Alert>
            </div>
            ) : null}
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsPreUploadCheckVisible(false)} disabled={isUploading}>Cancel</AlertDialogCancel>
                
                {scanResults?.overallRisk === 'High' && isAdmin && !adminOverride && (
                    <Button variant="secondary" onClick={() => setAdminOverride(true)} disabled={isUploading}>
                        <ShieldCheck className="mr-2"/> Admin Override
                    </Button>
                )}

                <AlertDialogAction 
                    onClick={uploadToYouTube} 
                    disabled={isScanning || isUploading || uploadIsBlocked}
                    className={cn(uploadIsBlocked && "bg-muted-foreground hover:bg-muted-foreground")}
                >
                    {isUploading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {uploadIsBlocked ? "Upload Blocked" : "Confirm & Upload"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudioLayout>
  );
}
