'use server';
/**
 * @fileOverview A Genkit flow for generating 3D-style character avatars from a text description.
 *
 * - generateAvatar - A function that handles the avatar generation.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import type { GenerateAvatarInput, GenerateAvatarOutput } from '@/lib/types';

const GenerateAvatarInputSchema = z.object({
  description: z.string().describe('A text description of the desired avatar.'),
});

const GenerateAvatarOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe('The generated avatar image as a data URI, including MIME type and Base64 encoding.'),
});

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return await generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: `Generate a high-quality 3D rendered character portrait based on the following description. The character should be centered and have a simple, neutral background. Description: ${input.description}`,
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate avatar image.');
    }

    return {
      imageDataUri: media.url,
    };
  }
);
