'use server';
/**
 * @fileOverview A Genkit flow for generating YouTube video metadata.
 *
 * - generateYoutubeMetadata - A function that generates a title, description, and tags.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const YoutubeMetadataInputSchema = z.object({
  prompt: z.string().describe('The original prompt used to generate the video.'),
  style: z.string().optional().describe('The artistic style of the video.'),
});
export type YoutubeMetadataInput = z.infer<typeof YoutubeMetadataInputSchema>;

export const YoutubeMetadataOutputSchema = z.object({
  title: z.string().describe('A catchy, SEO-friendly YouTube title, under 100 characters.'),
  description: z.string().describe('A detailed YouTube video description, including a summary and relevant hashtags.'),
  tags: z.array(z.string()).describe('An array of 5-10 relevant, viral tags for the video.'),
});
export type YoutubeMetadataOutput = z.infer<typeof YoutubeMetadataOutputSchema>;


export async function generateYoutubeMetadata(input: YoutubeMetadataInput): Promise<YoutubeMetadataOutput> {
  return await generateYoutubeMetadataFlow(input);
}

const generateYoutubeMetadataFlow = ai.defineFlow(
  {
    name: 'generateYoutubeMetadataFlow',
    inputSchema: YoutubeMetadataInputSchema,
    outputSchema: YoutubeMetadataOutputSchema,
  },
  async ({prompt, style}) => {
    const { output } = await ai.generate({
        prompt: `You are a YouTube growth expert. Based on the following video concept, generate an optimized title, description, and tags to maximize views.

        Video Prompt: "${prompt}"
        Video Style: ${style || 'Not specified'}
        
        Your output must be a JSON object with "title", "description", and "tags" keys.
        - The title should be catchy and under 100 characters.
        - The description should be informative and include relevant hashtags.
        - The tags should be an array of 5-10 popular and relevant keywords.`,
        output: { schema: YoutubeMetadataOutputSchema },
    });

    return output!;
  }
);
