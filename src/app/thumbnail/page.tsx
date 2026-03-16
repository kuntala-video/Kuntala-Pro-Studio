'use client';

import { Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudioLayout } from "@/components/studio-layout";

export default function ThumbnailPage() {
  return (
    <StudioLayout>
        <Card className="mt-6">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
            <ImageIcon className="text-primary" /> AI Thumbnail Generator
            </CardTitle>
            <CardDescription>
            Automatically generate a compelling thumbnail for your video.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <p className="text-lg font-semibold">Coming Soon!</p>
            <p>This feature is currently under development.</p>
            </div>
        </CardContent>
        </Card>
    </StudioLayout>
  );
}
