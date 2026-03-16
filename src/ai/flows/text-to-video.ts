'use server';
/**
 * @fileOverview A Genkit flow for generating video from a text prompt using Veo.
 *
 * - generateVideo - A function that handles the text-to-video generation process.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import type { TextToVideoInput, TextToVideoOutput } from '@/lib/types';

const TextToVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate a video from.'),
  style: z.string().optional().describe('The artistic style of the video.'),
  duration: z.number().min(1).max(8).optional().default(5).describe('The duration of the video in seconds.'),
});

const TextToVideoOutputSchema = z.object({
  video: z
    .string()
    .describe('The generated video as a data URI, including MIME type and Base64 encoding.'),
});

export async function generateVideo(input: TextToVideoInput): Promise<TextToVideoOutput> {
  try {
    return await textToVideoFlow(input);
  } catch (error: any) {
    console.error('Error in generateVideo flow:', error);
    throw new Error('Failed to generate video from the AI model. Please try again.');
  }
}

async function fetchVideoAsDataUri(url: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    const videoDownloadResponse = await fetch(`${url}&key=${process.env.GEMINI_API_KEY}`);
    
    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to fetch video. Status: ${videoDownloadResponse.status}`);
    }

    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(videoBuffer).toString('base64');
    
    // The content type might not be populated, so we'll assume video/mp4 as per docs.
    const contentType = videoDownloadResponse.headers.get('content-type') || 'video/mp4';

    return `data:${contentType};base64,${base64Video}`;
}


const textToVideoFlow = ai.defineFlow(
  {
    name: 'textToVideoFlow',
    inputSchema: TextToVideoInputSchema,
    outputSchema: TextToVideoOutputSchema,
  },
  async ({ prompt, style, duration }) => {
    const fullPrompt = style ? `${prompt}, in the style of ${style}` : prompt;

    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: fullPrompt,
      config: {
        durationSeconds: duration,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Poll for completion
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media?.url) {
      throw new Error('Failed to find the generated video in the operation result');
    }

    // Fetch the video from the URL and convert to a data URI
    const videoDataUri = await fetchVideoAsDataUri(videoPart.media.url);

    return {
      video: videoDataUri,
    };
  }
);
