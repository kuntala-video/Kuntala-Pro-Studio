
'use client';

import { StudioLayout } from '@/components/studio-layout';
import { AnimationStudioContent } from '@/components/animation-studio-content';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Video } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DemoModal } from '@/components/demo-modal';

export default function AnimationStudioPage() {
  const { userProfile, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (userProfile && userProfile.role !== 'super_admin' && !userProfile.permissions?.animation) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the Animation Studio.',
        variant: 'destructive',
      });
      router.replace('/guest');
    }
  }, [userProfile, isLoading, router, toast]);

  if (isLoading || !userProfile) {
    return (
      <StudioLayout>
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </StudioLayout>
    );
  }
  
  if (userProfile.role !== 'super_admin' && !userProfile.permissions?.animation) {
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
    <StudioLayout noPadding>
      <div className="absolute top-20 right-6 z-20">
        <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" size="sm">
          <Video className="mr-2 h-4 w-4" />
          Watch Demo
        </Button>
      </div>
      <DemoModal
        isOpen={isDemoModalOpen}
        onOpenChange={setIsDemoModalOpen}
        title="Animation Studio"
        description="The Animation Studio is a powerful tool for creating 2D animations. Drag and drop characters and props from the asset library, pose them in the workspace, and use the timeline to create keyframe animations."
      />
      <AnimationStudioContent />
    </StudioLayout>
  );
}
