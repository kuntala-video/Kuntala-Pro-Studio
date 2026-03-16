'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Film, Sparkles, Download, Image as ImageIcon } from 'lucide-react';
import { cartoonStylize } from '@/ai/flows/cartoon-stylization';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

export function VideoConverter() {
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [stylizedImageUrl, setStylizedImageUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('Awaiting video upload...');
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Effect to simulate progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; // Don't let it reach 100 until done
          return prev + 10;
        });
      }, 500);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        // Revoke previous object URL if it exists
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setThumbnailUrl(null);
        setStylizedImageUrl(null);
        setStatusText('Video loaded. Ready to process.');
      } else {
        toast({ title: "Invalid File Type", description: "Please upload a video file.", variant: "destructive" });
      }
    }
  };

  const processVideo = async () => {
    if (!videoRef.current || !canvasRef.current || !videoUrl) {
      toast({ title: 'Error', description: 'Video element not ready.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setThumbnailUrl(null);
    setStylizedImageUrl(null);
    setStatusText('Extracting first frame...');
    toast({ title: "Processing Started", description: "Extracting thumbnail from the video." });

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    video.onloadeddata = () => {
      video.currentTime = 0.1; // Seek to a very early frame to ensure it's loaded
    };

    video.onseeked = async () => {
      // This event can fire multiple times. We only want to run our logic once per "processVideo" call.
      // By checking thumbnailUrl, we ensure it only runs on the first successful seek.
      if (video.seeking || thumbnailUrl) return; 

      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL('image/jpeg');
        setThumbnailUrl(frameDataUrl);
        
        setStatusText('Applying AI style to frame...');
        toast({ title: "Frame Extracted", description: "Applying AI style to the thumbnail." });

        try {
          const stylizationResult = await cartoonStylize({
            imageDataUri: frameDataUrl,
            styleDescription: 'A vibrant, 2D animated cartoon style with bold outlines.',
          });
          setStylizedImageUrl(stylizationResult.stylizedImageDataUri);
          setStatusText('Processing complete.');
          toast({ title: "Stylization Complete!", description: "Your stylized frame is ready for download." });
        } catch (error) {
          console.error(error);
          toast({ title: "Stylization Failed", description: "Could not apply AI style.", variant: "destructive" });
          setStatusText('An error occurred during stylization.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setStatusText('Failed to get canvas context.');
        toast({ title: 'Canvas Error', description: 'Could not prepare image for processing.', variant: 'destructive'});
      }
    };

    video.onerror = () => {
        setIsLoading(false);
        setStatusText('Failed to load video.');
        toast({ title: 'Video Error', description: 'Could not load the selected video file.', variant: 'destructive'});
    }
    
    // Set the src to trigger the events.
    video.src = videoUrl;
  };

  const handleDownload = () => {
    if (!stylizedImageUrl) return;
    const link = document.createElement('a');
    link.href = stylizedImageUrl;
    link.download = 'stylized-frame.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Film className="text-primary" /> Video Converter (MVP)
        </CardTitle>
        <CardDescription>
          Upload a video to extract and stylize the first frame as a preview.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="video-upload">1. Upload Video</Label>
            <Input 
              id="video-upload" 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="video/mp4,video/quicktime,video/x-msvideo"
              className="hidden" 
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <Upload className="mr-2" /> {videoFile ? `Selected: ${videoFile.name}` : 'Select Video File (.mp4, .mov, .avi)'}
            </Button>
          </div>
          {videoUrl && (
            <div className="grid gap-2">
                <Label>2. Process Video</Label>
                <Button onClick={processVideo} disabled={isLoading || !videoFile} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Sparkles className="mr-2" />}
                    Extract & Stylize First Frame
                </Button>
            </div>
          )}
        </div>

        {isLoading && (
            <div className='space-y-2'>
                <Label>{statusText}</Label>
                <Progress value={progress} />
            </div>
        )}
        
        {!isLoading && stylizedImageUrl && (
            <div className='text-center space-y-2'>
                <p className="text-sm font-medium text-green-600">{statusText}</p>
            </div>
        )}


        {(thumbnailUrl || stylizedImageUrl || isLoading) && (
             <div className="grid md:grid-cols-2 gap-4 mt-4">
                 <div>
                    <Label className="text-center block mb-2">Original Frame</Label>
                    <Card className="aspect-video flex items-center justify-center bg-muted">
                        {thumbnailUrl ? <Image src={thumbnailUrl} alt="Video thumbnail" width={1280} height={720} className="rounded-md object-contain max-h-full" /> : <ImageIcon className="h-10 w-10 text-muted-foreground" />}
                    </Card>
                 </div>
                 <div>
                    <Label className="text-center block mb-2">Stylized Output</Label>
                     <Card className="aspect-video flex items-center justify-center bg-muted">
                        {isLoading && !stylizedImageUrl && <Loader2 className="h-10 w-10 text-primary animate-spin"/>}
                        {stylizedImageUrl && <Image src={stylizedImageUrl} alt="Stylized frame" width={1280} height={720} className="rounded-md object-contain max-h-full" />}
                        {!isLoading && !stylizedImageUrl && <ImageIcon className="h-10 w-10 text-muted-foreground" />}
                    </Card>
                 </div>
             </div>
        )}

        {!isLoading && stylizedImageUrl && (
            <div className="flex flex-col items-center justify-center mt-4 space-y-2">
                <Label>3. Download</Label>
                <Button onClick={handleDownload}>
                    <Download className="mr-2"/> Download Stylized Preview
                </Button>
            </div>
        )}

        {/* Hidden elements for processing */}
        <video ref={videoRef} className="hidden" crossOrigin="anonymous" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
