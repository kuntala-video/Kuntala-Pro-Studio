
import type { DocumentData, Timestamp } from 'firebase/firestore';

export interface UserPermissions {
  animation: boolean;
  reels: boolean;
  voiceClone: boolean;
  avatar: boolean;
  cinematic: boolean;
}

export interface UserProfile extends DocumentData {
  id: string; // id is same as uid
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'staff' | 'subscriber' | 'super_admin';
  plan: 'free' | 'monthly' | 'quarterly' | 'yearly' | 'enterprise';
  subscriptionStart?: Timestamp;
  subscriptionEnd?: Timestamp;
  disabled: boolean;
  permissions: UserPermissions;
  createdBy?: string;
  wallet?: {
    credits: number;
    spent: number;
  };
  phone?: string;
  linkedPaymentRequestId?: string;
}

export interface PaymentRequest extends DocumentData {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  plan: string;
  amount: number;
  transactionId: string;
  screenshotBase64?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  generatedUserId?: string;
  generatedPassword?: string;
  approvedAt?: Timestamp;
}


export interface QrSetting extends DocumentData {
  id: string;
  qrImage: string;
  active: boolean;
  updatedAt: Timestamp;
}

export interface ManualAccount extends DocumentData {
    id: string;
    email: string;
    userId: string; // This is the generated username e.g. guest_2024_001
    role: UserProfile['role'];
    plan: UserProfile['plan'];
    createdAt: Timestamp;
    expiresAt: Timestamp;
    paymentRequestId: string;
}

export interface ActivityLog extends DocumentData {
    id: string;
    actorUid: string;
    actorEmail: string;
    action: string;
    details: Record<string, any>;
    timestamp: Timestamp;
}

export interface EpisodeGeneration {
  id: string;
  generatedAt: Timestamp;
  episodes: { episode: number; title: string; }[];
}

export interface VideoGeneration {
  id: string;
  generatedAt: Timestamp;
  prompt: string;
  style?: string;
  duration?: number;
  videoUrl: string;
  usedInTimeline?: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  audioUrl: string;
  createdAt: Timestamp;
  usedInTimeline?: boolean;
}

export interface VoiceRecording {
  id: string;
  name: string;
  audioUrl: string;
  createdAt: Timestamp;
  duration: number; // in seconds
}

export interface Character {
  id: string;
  name: string;
  traits: string;
  style: string;
  costumes?: string[];
  voiceProfileId?: string;
  createdAt: Timestamp;
  usedInTimeline?: boolean;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  order: number;
  background: string;
  characters: {
    src: string;
    x: number;
    y: number;
    speed: number;
  }[];
  duration: number;
  usedInTimeline?: boolean;
}

export interface MixerSource {
  id: string;
  name: string;
  type: 'camera' | 'screen' | 'video_file' | 'mobile' | 'drone' | 'router' | 'hdmi';
}

export interface MixerConfig {
    sources: MixerSource[];
}

export interface StoryIdeaGeneration {
  id: string;
  generatedAt: Timestamp;
  ideas: StoryIdeaGeneratorOutput;
}

export interface TimelineAsset {
  id: string; // Unique ID for this instance on the timeline
  assetId: string; // ID of the source asset (e.g., from Character, VideoGeneration etc.)
  start: number; // in seconds
  duration: number; // in seconds
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay' | 'voice' | 'subtitles';
  assets: TimelineAsset[];
}

export interface Project extends DocumentData {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status?: 'active' | 'archived';
  scenes?: Scene[];
  episodes?: EpisodeGeneration[];
  videoGenerations?: VideoGeneration[];
  voiceProfiles?: VoiceProfile[];
  characters?: Character[];
  storyIdeas?: StoryIdeaGeneration[];
  mixerConfig?: MixerConfig;
  voiceRecordings?: VoiceRecording[];
  members?: string[];
  timeline?: TimelineTrack[];
}

export interface SystemLog extends DocumentData {
    id: string;
    level: 'error' | 'warn' | 'info';
    message: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: Timestamp;
    uid: string | 'anonymous';
    userAgent: string;
    url: string;
}

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  category: 'character' | 'prop' | 'background';
};

export interface CharacterConfig {
  x: number;
  y: number;
  speed: number;
  image: HTMLImageElement;
}

export interface SceneConfig {
  background: string;
  characters: {
    src: string;
    x: number;
    y: number;
    speed: number;
  }[];
  duration: number;
}

export interface TimelineFrame {
  time: number
  draw: (ctx: CanvasRenderingContext2D) => void
}

export interface StoryIdeaGeneratorInput {
  userRequest: string;
  ideaType?: "plot" | "character" | "scene";
  genre?: string;
  length?: 'short' | 'medium' | 'long';
}

export interface StoryIdeaGeneratorOutput {
  summary: string;
  plotlines?: string[];
  characterConcepts?: string[];
  sceneOutlines?: string[];
}

export interface CartoonStylizationInput {
  imageDataUri: string;
  styleDescription: string;
}

export interface CartoonStylizationOutput {
  stylizedImageDataUri: string;
}

export interface GenerateAvatarInput {
  description: string;
}

export interface GenerateAvatarOutput {
  imageDataUri: string;
}

export interface TextToSpeechInput {
  textToSynthesize: string;
  voice?: string;
}

export interface TextToSpeechOutput {
  audioDataUri: string;
}

export interface TextToVideoInput {
  prompt: string;
  style?: string;
  duration?: number;
}

export interface TextToVideoOutput {
  video: string;
}

export interface SupportTicket extends DocumentData {
  id: string;
  userId: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: Timestamp;
}

export interface AdSettings {
  enabled: boolean;
  mode: 'bottom-banner' | 'side-banner' | 'image-overlay' | 'text-ticker';
  imageUrl: string | null;
  text: string;
  opacity: number;
}

export interface CricketScore {
  team1Name: string;
  team2Name: string;
  innings: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  target: number;
  runsRequired: number;
  ballsRemaining: number;
}

export interface AdminNotification extends DocumentData {
  id: string;
  type: 'payment_request';
  referenceId: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface SubscriptionPlan extends DocumentData {
  id: string;
  name: 'monthly' | 'quarterly' | 'yearly' | 'enterprise';
  durationInMonths: number;
  price: number;
  currency: string;
  isActive: boolean;
}

export interface ExportJob extends DocumentData {
  id: string;
  projectId: string;
  projectName: string;
  format: 'video' | 'gif' | 'frames';
  resolution: '720p' | '1080p' | '4K';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  progress: number;
  outputFileUrl?: string;
  requestedByUserId: string;
  requestTimestamp: Timestamp;
  completionTimestamp?: Timestamp;
  timelineVersion?: number;
  assetVersion?: number;
  failureReason?: string;
}
