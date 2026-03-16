'use client';

import React from 'react';
import Link from 'next/link';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  LifeBuoy,
  Star,
  Film,
  Sparkles,
  Bot,
  Youtube,
  Clapperboard,
  FileText,
  ImageIcon,
  Mic,
  Crown,
  MicVocal,
  Video,
  User,
  Users,
  Tv,
  SlidersHorizontal,
  BrainCircuit,
  BookCopy,
  GalleryHorizontal,
  Library,
  Radio,
  Wand2,
  Paintbrush,
  Palette,
  ShieldCheck,
  Smile,
  LayoutGrid,
  QrCode,
  CreditCard,
  UserPlus,
  Scissors,
  PackageCheck,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Badge } from './ui/badge';
import { useTranslation } from '@/context/i18n-context';

export const AppSidebar = React.memo(function AppSidebar() {
  const pathname = usePathname();
  const { userProfile } = useUser();
  const { db } = useFirebase();
  const { t } = useTranslation();

  const isAdmin = userProfile && ['admin', 'super_admin'].includes(userProfile.role);
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isSubscriber = userProfile?.role === 'subscriber';
  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));
  
  const dashboardPath = isAdmin ? '/admin-dashboard' : '/guest';

  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    if (!db || !isAdmin) {
        setPendingCount(0);
        return;
    };

    const q = query(collection(db, "paymentRequests"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setPendingCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [db, isAdmin]);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <h1 className="font-headline text-lg font-semibold tracking-wider">
            Kuntala Pro Studio
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={dashboardPath}>
              <SidebarMenuButton isActive={isActive('/admin-dashboard') || isActive('/guest')} tooltip={t('sidebar_dashboard')}>
                <LayoutDashboard />
                {t('sidebar_dashboard')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/projects">
                <SidebarMenuButton isActive={isActive('/projects')} tooltip={t('sidebar_projects')}>
                  <FolderKanban />
                  {t('sidebar_projects')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/asset-library">
                <SidebarMenuButton isActive={isActive('/asset-library')} tooltip={t('sidebar_asset_library')}>
                  <Library />
                  {t('sidebar_asset_library')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {userProfile?.permissions?.animation && (
            <SidebarMenuItem>
              <Link href="/animation-studio">
                <SidebarMenuButton isActive={isActive('/animation-studio')} tooltip={t('sidebar_animation_studio')}>
                  <Palette />
                  {t('sidebar_animation_studio')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/timeline">
                <SidebarMenuButton isActive={isActive('/timeline')} tooltip={t('sidebar_timeline_editor')}>
                  <Scissors />
                  {t('sidebar_timeline_editor')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/export-queue">
                <SidebarMenuButton isActive={isActive('/export-queue')} tooltip={t('sidebar_export_queue')}>
                  <PackageCheck />
                  {t('sidebar_export_queue')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <Link href="/avatar3d-creator">
              <SidebarMenuButton isActive={isActive('/avatar3d-creator')} tooltip={t('sidebar_3d_avatar')}>
                <User />
                {t('sidebar_3d_avatar')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/reels">
              <SidebarMenuButton isActive={isActive('/reels')} tooltip={t('sidebar_reels_generator')}>
                <Film />
                {t('sidebar_reels_generator')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/cinematic-camera">
              <SidebarMenuButton isActive={isActive('/cinematic-camera')} tooltip={t('sidebar_cinematic_camera')}>
                <Video />
                {t('sidebar_cinematic_camera')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {userProfile?.permissions?.voiceClone && (
            <SidebarMenuItem>
              <Link href="/voice-clone">
                <SidebarMenuButton isActive={isActive('/voice-clone')} tooltip={t('sidebar_voice_clone')}>
                  <MicVocal />
                  {t('sidebar_voice_clone')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <Link href="/lipsync">
              <SidebarMenuButton isActive={isActive('/lipsync')} tooltip={t('sidebar_lip_sync_studio')}>
                <Smile />
                {t('sidebar_lip_sync_studio')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/ai-video-generator">
              <SidebarMenuButton isActive={isActive('/ai-video-generator')} tooltip={t('sidebar_ai_video_generator')}>
                <Video />
                {t('sidebar_ai_video_generator')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/netflix-movie-generator">
              <SidebarMenuButton isActive={isActive('/netflix-movie-generator')} tooltip={t('sidebar_netflix_movie')}>
                <Tv />
                {t('sidebar_netflix_movie')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/live-mixer-studio">
                <SidebarMenuButton isActive={isActive('/live-mixer-studio')} tooltip={t('sidebar_live_mixer_studio')}>
                  <SlidersHorizontal />
                  {t('sidebar_live_mixer_studio')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/advanced-live-mixer">
                <SidebarMenuButton isActive={isActive('/advanced-live-mixer')} tooltip={t('sidebar_advanced_mixer')}>
                  <LayoutGrid />
                  {t('sidebar_advanced_mixer')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/character-manager">
                <SidebarMenuButton isActive={isActive('/character-manager')} tooltip={t('sidebar_character_manager')}>
                  <Users />
                  {t('sidebar_character_manager')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/character-memory-manager">
                <SidebarMenuButton isActive={isActive('/character-memory-manager')} tooltip={t('sidebar_character_memory')}>
                  <BrainCircuit />
                  {t('sidebar_character_memory')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/episode-engine">
                <SidebarMenuButton isActive={isActive('/episode-engine')} tooltip={t('sidebar_episode_engine')}>
                  <BookCopy />
                  {t('sidebar_episode_engine')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/scene-manager">
                <SidebarMenuButton isActive={isActive('/scene-manager')} tooltip={t('sidebar_scene_manager')}>
                  <GalleryHorizontal />
                  {t('sidebar_scene_manager')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/live-stream">
                <SidebarMenuButton isActive={isActive('/live-stream')} tooltip={t('sidebar_live_stream')}>
                  <Radio />
                  {t('sidebar_live_stream')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}

          <SidebarSeparator className="my-2" />

          <SidebarMenuItem>
            <Link href="/master-studio">
              <SidebarMenuButton isActive={isActive('/master-studio')} tooltip={t('sidebar_master_ai_studio')}>
                <Crown />
                {t('sidebar_master_ai_studio')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/prostudio">
              <SidebarMenuButton isActive={isActive('/prostudio')} tooltip={t('sidebar_pro_studio')}>
                <Sparkles />
                {t('sidebar_pro_studio')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/automation">
              <SidebarMenuButton isActive={isActive('/automation')} tooltip={t('sidebar_automation')}>
                <Bot />
                {t('sidebar_automation')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/youtube-publisher">
              <SidebarMenuButton isActive={isActive('/youtube-publisher')} tooltip={t('sidebar_youtube_publisher')}>
                <Youtube />
                {t('sidebar_youtube_publisher')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/voice">
              <SidebarMenuButton isActive={isActive('/voice')} tooltip={t('sidebar_voice_studio_pro')}>
                <Mic />
                {t('sidebar_voice_studio_pro')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/thumbnail">
                <SidebarMenuButton isActive={isActive('/thumbnail')} tooltip={t('sidebar_ai_thumbnails')}>
                  <ImageIcon />
                  {t('sidebar_ai_thumbnails')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <Link href="/story-generator">
              <SidebarMenuButton isActive={isActive('/story-generator')} tooltip={t('sidebar_story_ai')}>
                <Wand2 />
                {t('sidebar_story_ai')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/cartoon-stylizer">
              <SidebarMenuButton isActive={isActive('/cartoon-stylizer')} tooltip={t('sidebar_stylizer_ai')}>
                <Paintbrush />
                {t('sidebar_stylizer_ai')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/video-converter">
                <SidebarMenuButton isActive={isActive('/video-converter')} tooltip={t('sidebar_video_converter')}>
                  <Film />
                  {t('sidebar_video_converter')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          
          <SidebarMenuItem>
            <Link href="/studio">
              <SidebarMenuButton isActive={isActive('/studio')} tooltip={t('sidebar_ai_studio')}>
                <Clapperboard />
                {t('sidebar_ai_studio')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/script">
              <SidebarMenuButton isActive={isActive('/script')} tooltip={t('sidebar_ai_script_writer')}>
                <FileText />
                {t('sidebar_ai_script_writer')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {!isSubscriber && (
            <SidebarMenuItem>
              <Link href="/channel">
                <SidebarMenuButton isActive={isActive('/channel')} tooltip={t('sidebar_auto_channel')}>
                  <Youtube />
                  {t('sidebar_auto_channel')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {isAdmin && (
            <>
            <SidebarMenuItem>
              <Link href="/manual-accounts">
                <SidebarMenuButton isActive={isActive('/manual-accounts')} tooltip={t('sidebar_manual_accounts')}>
                  <Users />
                  {t('sidebar_manual_accounts')}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/payment-requests">
                <SidebarMenuButton isActive={isActive('/payment-requests')} tooltip={t('sidebar_payment_requests')}>
                  <CreditCard />
                  {t('sidebar_payment_requests')}
                </SidebarMenuButton>
                {pendingCount > 0 && <SidebarMenuBadge>{pendingCount}</SidebarMenuBadge>}
              </Link>
            </SidebarMenuItem>
            </>
          )}
          {isSuperAdmin && (
            <>
              <SidebarMenuItem>
                  <Link href="/admin-qr-manager">
                      <SidebarMenuButton isActive={isActive('/admin-qr-manager')} tooltip={t('sidebar_qr_manager')}>
                          <QrCode />
                          {t('sidebar_qr_manager')}
                      </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin-staff">
                  <SidebarMenuButton isActive={isActive('/admin-staff')} tooltip={t('sidebar_admin_staff')}>
                    <ShieldCheck />
                    {t('sidebar_admin_staff')}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/settings">
                  <SidebarMenuButton isActive={isActive('/settings')} tooltip={t('sidebar_settings')}>
                    <Settings />
                    {t('sidebar_settings')}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </>
          )}
          <SidebarMenuItem>
            <Link href="/support">
              <SidebarMenuButton isActive={isActive('/support')} tooltip={t('sidebar_support')}>
                <LifeBuoy />
                {t('sidebar_support')}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
});
