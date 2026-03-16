'use client';

import { useState, useRef } from 'react';
import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Smile, Upload, Play, Music } from 'lucide-react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';

export default function LipSyncPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    
    // Form state
    const [character, setCharacter] = useState('Brave Knight');
    const [dialogue, setDialogue] = useState('I will defeat the dragon and save the kingdom!');
    const [voiceAudio, setVoiceAudio] = useState<string | null>(null);
    const [musicAudio, setMusicAudio] = useState<string | null>(null);

    const voiceFileInputRef = useRef<HTMLInputElement>(null);
    const musicFileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setAudio: (src: string | null) => void) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAudio(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!dialogue || !character || !voiceAudio) {
            toast({ title: "Missing inputs", description: "Character, dialogue, and a voice audio file are required.", variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/lipsync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: dialogue, character }),
            });
            if (!res.ok) throw new Error('Failed to generate lip sync data');
            const data = await res.json();
            setResult(data);
            toast({ title: 'Lip Sync Generated', description: 'Preview your synchronized audio and video.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const characterImage = placeholderImages.find(img => img.category === 'character' && img.description === character) || placeholderImages.find(img => img.category === 'character');

    return (
        <StudioLayout>
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-2">
                        <Smile className="h-8 w-8 text-primary" />
                        AI Lip Sync Studio
                    </CardTitle>
                    <CardDescription>
                        Automatically synchronize a character's mouth movements with a voice-over track.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* CONTROLS */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="character">Character</Label>
                                <Input id="character" value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="e.g., 'Brave Knight'" required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dialogue">Dialogue</Label>
                                <Textarea id="dialogue" value={dialogue} onChange={(e) => setDialogue(e.target.value)} placeholder="Enter the dialogue for the character..." required disabled={isLoading} rows={4} />
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="voice-audio">Voice Audio</Label>
                                <Input type="file" ref={voiceFileInputRef} onChange={(e) => handleFileChange(e, setVoiceAudio)} accept="audio/*" className="hidden" />
                                <Button type="button" variant="outline" onClick={() => voiceFileInputRef.current?.click()} disabled={isLoading}>
                                    <Upload className="mr-2" /> {voiceAudio ? "Change Voice File" : "Upload Voice File"}
                                </Button>
                                {voiceAudio && <audio src={voiceAudio} controls className="w-full h-10 mt-2"/>}
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="music-audio">Background Music (Optional)</Label>
                                <Input type="file" ref={musicFileInputRef} onChange={(e) => handleFileChange(e, setMusicAudio)} accept="audio/*" className="hidden" />
                                <Button type="button" variant="outline" onClick={() => musicFileInputRef.current?.click()} disabled={isLoading}>
                                    <Music className="mr-2" /> {musicAudio ? "Change Music File" : "Upload Music File"}
                                </Button>
                                {musicAudio && <audio src={musicAudio} controls className="w-full h-10 mt-2"/>}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading || !voiceAudio}>
                                {isLoading ? <><Loader2 className="animate-spin mr-2" /> Generating Sync Data...</> : "Generate Lip Sync"}
                            </Button>
                        </form>

                        {/* PREVIEW */}
                        <div className="space-y-4">
                            <Label>Final Preview</Label>
                             <Card className="aspect-video relative flex items-center justify-center bg-card-foreground">
                                {characterImage && <Image src={characterImage.imageUrl} alt={character} layout="fill" objectFit="cover" className="opacity-50" />}
                                <div className="z-10 text-center text-background p-4">
                                    <h3 className="font-bold text-2xl">Visual Preview</h3>
                                    <p className="text-sm">Mouth animation would appear here.</p>
                                </div>
                            </Card>
                            {result && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Lip Sync Data</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="text-xs bg-muted p-2 rounded-md max-h-40 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
                                    </CardContent>
                                </Card>
                            )}
                            
                            <Button className="w-full" variant="secondary" onClick={() => {
                                if (!voiceAudio) return;
                                const voice = new Audio(voiceAudio);
                                voice.play();
                                if (musicAudio) {
                                    const music = new Audio(musicAudio);
                                    music.volume = 0.3; // Lower music volume
                                    music.play();
                                }
                            }} disabled={!voiceAudio}>
                                <Play className="mr-2" /> Play All Audio
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </StudioLayout>
    );
}
