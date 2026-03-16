'use client';

import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight, CreditCard, Calendar } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useTranslation } from '@/context/i18n-context';

const modules = [
  { title: 'Admin Dashboard', href: '/admin-dashboard', description: 'System-wide statistics and user management.', adminOnly: true },
  { title: 'User Management', href: '/admin-control', description: 'Manage user accounts, roles, and permissions.', adminOnly: true },
  { title: 'Projects', href: '/projects', description: 'View and manage all your creative projects.', subscriberHide: true },
  { title: 'Animation Studio', href: '/animation-studio', description: 'Compose scenes, add characters, and animate.' },
  { title: 'AI Video Generator', href: '/ai-video-generator', description: 'Generate video clips from text prompts using AI.' },
  { title: 'Voice Clone', href: '/voice-clone', description: 'Upload voice samples to create reusable voice profiles.', subscriberHide: true },
  { title: 'Cinematic Camera', href: '/cinematic-camera', description: 'Generate a dynamic camera movement plan for your scene.' },
  { title: 'Reels Generator', href: '/reels', description: 'Generate a plan for a short, engaging vertical video.' },
  { title: '3D Avatar Creator', href: '/avatar3d-creator', description: 'Describe your character and let AI create a 3D-style avatar.' },
  { title: 'Netflix Movie Generator', href: '/netflix-movie-generator', description: 'Generate a plan for a full series with a Netflix-style feel.' },
  { title: 'Live Mixer Studio', href: '/live-mixer-studio', description: 'Configure and manage the video sources for your live broadcast.', subscriberHide: true },
  { title: 'Character Memory', href: '/character-memory-manager', description: 'Lock key attributes of your character for consistency.', subscriberHide: true },
  { title: 'Character Manager', href: '/character-manager', description: 'Create and manage characters for your projects.', subscriberHide: true },
  { title: 'Scene Manager', href: '/scene-manager', description: 'Organize your project\'s scenes and sequence.', subscriberHide: true },
  { title: 'Asset Library', href: '/asset-library', description: 'A central library for all your assets.', subscriberHide: true },
  { title: 'Episode Engine', href: '/episode-engine', description: 'Generate a list of episodes for your series from a single topic.', subscriberHide: true },
  { title: 'Story AI', href: '/story-generator', description: 'Get plotlines, character concepts, or scene outlines.' },
  { title: 'Stylizer AI', href: '/cartoon-stylizer', description: 'Upload an image and describe a cartoon style to transform it.' },
  { title: 'Video Converter', href: '/video-converter', description: 'Convert videos into different formats and styles (Coming Soon).', subscriberHide: true },
  { title: 'Live Stream', href: '/live-stream', description: 'Configure your stream and go live to your audience.', subscriberHide: true },
  { title: 'AI Studio', href: '/studio', description: 'Let the AI Director start the film production process.' },
  { title: 'AI Script Writer', href: '/script', description: 'Enter a topic and let our AI generate a basic script outline.' },
  { title: 'AI Thumbnails', href: '/thumbnail', description: 'Automatically generate a compelling thumbnail (Coming Soon).', subscriberHide: true },
  { title: 'Voice Studio', href: '/voice', description: 'Generate speech from text, select voices, and download audio.' },
  { title: 'Pro Studio', href: '/prostudio', description: 'Enter a topic to generate a full AI movie pipeline status.' },
  { title: 'Master AI Studio', href: '/master-studio', description: 'The all-in-one toolkit to take your idea from script to screen.' },
  { title: 'Automation', href: '/automation', description: 'Enter a topic to automatically generate a video.' },
  { title: 'Auto Channel', href: '/channel', description: 'Enter a topic for a simulated 24/7 automated channel.', subscriberHide: true },
];

const FeatureCard = ({ title, description, href }: { title: string, description: string, href: string }) => {
    const router = useRouter();
    return (
        <Card className="hover:border-primary/50 transition-colors flex flex-col">
            <CardHeader className="flex-grow">
                <CardTitle className="font-headline text-xl">{title}</CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" size="sm" onClick={() => router.push(href)}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
};

const FeatureCardSkeleton = () => (
    <Card>
        <CardHeader className="flex-grow">
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-1 mt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-9 w-24" />
        </CardContent>
    </Card>
);

export default function GuestPage() {
    const { userProfile, isLoading } = useUser();
    const { t } = useTranslation();
    
    const isSubscriber = userProfile?.role === 'subscriber';

    const visibleModules = modules.filter(module => {
        if (module.adminOnly) return false;
        if (isSubscriber && module.subscriberHide) return false;

        if (module.href === '/animation-studio' && userProfile?.permissions?.animation === false) {
            return false;
        }
        if (module.href === '/reels' && userProfile?.permissions?.reels === false) {
            return false;
        }
        if (module.href === '/voice-clone' && userProfile?.permissions?.voiceClone === false) {
            return false;
        }
        if (module.href === '/avatar3d-creator' && userProfile?.permissions?.avatar === false) {
            return false;
        }
        if (module.href === '/cinematic-camera' && userProfile?.permissions?.cinematic === false) {
            return false;
        }
        
        return true;
    });

  return (
    <StudioLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-headline mb-2">
          {t('creator_dashboard')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t('welcome_message', { name: userProfile?.displayName || userProfile?.email || 'Creator' })}
        </p>

        {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, i) => <FeatureCardSkeleton key={i} />)}
            </div>
        ) : (
            <>
                {userProfile && (
                    <Card className="mb-8 bg-muted/30">
                        <CardContent className="p-4 grid sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-background/50 rounded-lg">
                                <Label>{t('your_plan')}</Label>
                                <p className="font-bold text-lg capitalize">{userProfile.plan}</p>
                            </div>
                            <div className="p-4 bg-background/50 rounded-lg">
                                <Label className="flex items-center gap-2"><CreditCard/>{t('credits_remaining')}</Label>
                                <p className="font-bold text-lg">{userProfile.wallet?.credits ?? 0}</p>
                            </div>
                            <div className="p-4 bg-background/50 rounded-lg">
                                <Label className="flex items-center gap-2"><Calendar/>{t('subscription_expires')}</Label>
                                <p className="font-bold text-lg">{userProfile.subscriptionEnd ? format(userProfile.subscriptionEnd.toDate(), 'PP') : t('never')}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleModules.map(module => (
                        <FeatureCard key={module.href} {...module} />
                    ))}
                </div>
            </>
        )}
      </div>
    </StudioLayout>
  );
}
