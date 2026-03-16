'use client';
import { StudioLayout } from '@/components/studio-layout';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio } from 'lucide-react';

const LiveStreamerSkeleton = () => (
    <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Radio className="text-primary" /> <Skeleton className="h-8 w-64" />
                    </CardTitle>
                    <CardDescription>
                        <Skeleton className="h-4 w-96" />
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="w-full aspect-video" />
                </CardContent>
            </Card>
        </div>
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-6">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="grid gap-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                     <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-6">
                     <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
);

const LiveStreamer = dynamic(
    () => import('@/components/live-streamer').then(mod => mod.LiveStreamer),
    { 
        ssr: false,
        loading: () => <LiveStreamerSkeleton />
    }
);

export default function LiveStreamPage() {
  return (
    <StudioLayout>
      <LiveStreamer />
    </StudioLayout>
  );
}
