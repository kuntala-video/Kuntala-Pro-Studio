'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Youtube, Upload, Wand2, Calendar as CalendarIcon, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { StudioLayout } from '@/components/studio-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { YoutubeMetadataInput, YoutubeMetadataOutput } from '@/ai/flows/generate-youtube-metadata';


export default function YouTubePublisherPage() {
    const { toast } = useToast();
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [channelId, setChannelId] = useState('UC_ywRusZvXRyoGlf4hSEJPA');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPrompt, setVideoPrompt] = useState(''); // Prompt for AI generation
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    
    const [publishMode, setPublishMode] = useState<'private' | 'public' | 'scheduled'>('private');
    const [publishAt, setPublishAt] = useState<Date | undefined>(undefined);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVideoFile(file);
        }
    };
    
    const handleGenerateMetadata = async () => {
        if (!videoPrompt) {
            toast({ title: 'Video prompt is required to generate metadata.', variant: 'destructive'});
            return;
        }
        setIsGenerating(true);
        try {
            const payload: YoutubeMetadataInput = { prompt: videoPrompt };
            const res = await fetch('/api/generate-youtube-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to generate metadata');
            }
            const data: YoutubeMetadataOutput = await res.json();
            setTitle(data.title);
            setDescription(data.description);
            setTags(data.tags);
            toast({ title: 'Metadata Generated Successfully!'});
        } catch (error: any) {
            toast({ title: 'Generation Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpload = async () => {
        if (!videoFile) {
            toast({ title: 'No video file selected.', variant: 'destructive'});
            return;
        }
        setIsUploading(true);
        toast({ title: 'Simulating Upload...', description: 'This is a placeholder for the actual YouTube API integration.'});

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Uploading with settings:', {
            channelId,
            videoFile,
            title,
            description,
            tags,
            publishMode,
            publishAt: publishMode === 'scheduled' ? publishAt : undefined,
        });

        setIsUploading(false);
        toast({ title: 'Upload Simulation Complete!', description: 'Check console for upload details.'});
    };

    return (
        <StudioLayout>
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Youtube className="text-red-600"/> YouTube Publisher
                    </CardTitle>
                    <CardDescription>
                        Prepare and upload your generated videos directly to YouTube.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Channel Settings */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Channel Configuration</h3>
                        <Alert>
                            <LinkIcon className="h-4 w-4" />
                            <AlertTitle>Connect to YouTube</AlertTitle>
                            <AlertDescription>
                                This is a placeholder. In a real application, you would connect your YouTube account via OAuth2 here.
                            </AlertDescription>
                        </Alert>
                        <div className="grid gap-2">
                            <Label htmlFor="channel-id">Target Channel ID</Label>
                            <Input id="channel-id" value={channelId} onChange={e => setChannelId(e.target.value)} disabled={isUploading}/>
                        </div>
                    </div>

                    {/* Metadata Preparation */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Video Metadata</h3>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="video-prompt">Video Prompt for AI</Label>
                            <Textarea 
                                id="video-prompt"
                                placeholder="Enter the prompt used to generate your video. This helps the AI create accurate metadata."
                                value={videoPrompt}
                                onChange={e => setVideoPrompt(e.target.value)}
                                disabled={isGenerating || isUploading}
                            />
                        </div>

                        <Button onClick={handleGenerateMetadata} disabled={isGenerating || !videoPrompt}>
                            {isGenerating ? <Loader2 className="mr-2 animate-spin"/> : <Wand2 className="mr-2"/>}
                            Generate Title, Description & Tags
                        </Button>

                        <div className="grid gap-4 pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Video Title</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} disabled={isUploading}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} disabled={isUploading} rows={6}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tags">Tags (comma-separated)</Label>
                                <Input id="tags" value={tags.join(', ')} onChange={e => setTags(e.target.value.split(',').map(t => t.trim()))} disabled={isUploading}/>
                            </div>
                        </div>
                    </div>
                    
                    {/* Upload Section */}
                    <div className="space-y-4 p-4 border rounded-lg">
                         <h3 className="font-semibold text-lg">Upload & Publish</h3>
                        <div className="grid gap-2">
                            <Label htmlFor="video-file">Video File</Label>
                            <Input id="video-file" type="file" accept="video/*" ref={videoInputRef} onChange={handleFileChange} disabled={isUploading}/>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="publish-mode">Publish Mode</Label>
                                <Select value={publishMode} onValueChange={(value: any) => setPublishMode(value)} disabled={isUploading}>
                                    <SelectTrigger id="publish-mode"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="private">Private</SelectItem>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             {publishMode === 'scheduled' && (
                                <div className="grid gap-2">
                                    <Label>Publish Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("justify-start text-left font-normal", !publishAt && "text-muted-foreground")} disabled={isUploading}>
                                                <CalendarIcon className="mr-2"/>
                                                {publishAt ? format(publishAt, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={publishAt} onSelect={setPublishAt} initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>
                        
                        <Button onClick={handleUpload} disabled={isUploading || !videoFile} className="w-full">
                            {isUploading ? <Loader2 className="mr-2 animate-spin"/> : <Upload className="mr-2"/>}
                            Upload to YouTube
                        </Button>
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Developer Notice</AlertTitle>
                            <AlertDescription>
                                This is a UI simulation. The upload button does not perform a real upload to YouTube.
                            </AlertDescription>
                        </Alert>
                    </div>

                </CardContent>
            </Card>
        </StudioLayout>
    );
}
