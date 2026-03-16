'use server';
/**
 * @fileOverview A Genkit flow for converting still images into various 2D cartoon-like visual styles.
 *
 * - cartoonStylize - A function that handles the cartoon stylization process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CartoonStylizationInput, CartoonStylizationOutput } from '@/lib/types';

const CartoonStylizationInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A still image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  styleDescription: z
    .string()
    .describe('A description of the desired cartoon visual style (e.g., "Disney-like", "anime", "minimalist flat design").'),
});

const CartoonStylizationOutputSchema = z.object({
  stylizedImageDataUri: z
    .string()
    .describe('The cartoon-stylized image as a data URI, including MIME type and Base64 encoding.'),
});

export async function cartoonStylize(input: CartoonStylizationInput): Promise<CartoonStylizationOutput> {
  try {
    return await cartoonStylizationFlow(input);
  } catch(error: any) {
    console.error("Error in cartoonStylize flow:", error);
    throw new Error('Failed to stylize the image with the AI model. Please try again.');
  }
}

const cartoonStylizationFlow = ai.defineFlow(
  {
    name: 'cartoonStylizationFlow',
    inputSchema: CartoonStylizationInputSchema,
    outputSchema: CartoonStylizationOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image', // Using a model capable of image-to-image generation
      prompt: [
        {media: {url: input.imageDataUri}},
        {text: `Convert this image into a 2D cartoon visual style based on the following description: ${input.styleDescription}. The output should be a clear cartoon image.`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Requesting both text (for potential debugging/explanation) and image output
      },
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate stylized image or media URL is missing.');
    }

    return {
      stylizedImageDataUri: media.url,
    };
  }
);
