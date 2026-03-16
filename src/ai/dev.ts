'use server';
import { config } from 'dotenv';
config();

import '@/lib/story-generator.ts';
import '@/ai/flows/cartoon-stylization.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/text-to-video.ts';
import '@/ai/flows/generate-avatar.ts';
import '@/ai/flows/generate-script.ts';
import '@/ai/flows/generate-director-plan.ts';
import '@/ai/flows/generate-camera-plan.ts';
import '@/ai/flows/generate-episodes.ts';
import '@/ai/flows/generate-netflix-series-plan.ts';
import '@/ai/flows/generate-youtube-metadata.ts';
