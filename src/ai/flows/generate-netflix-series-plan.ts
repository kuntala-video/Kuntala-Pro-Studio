'use server';
/**
 * @fileOverview A Genkit flow for generating a Netflix-style series plan.
 *
 * - generateNetflixSeriesPlan - A function that handles the series plan generation.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNetflixSeriesPlanInputSchema = z.object({
  topic: z.string().describe('The topic or core concept of the series.'),
});
type GenerateNetflixSeriesPlanInput = z.infer<typeof GenerateNetflixSeriesPlanInputSchema>;

const GenerateNetflixSeriesPlanOutputSchema = z.object({
    topic: z.string(),
    style: z.string(),
    episodes: z.number(),
    duration: z.string(),
    quality: z.string(),
    genre: z.string(),
    logline: z.string().describe("A compelling one-sentence summary of the series."),
    status: z.string(),
});
type GenerateNetflixSeriesPlanOutput = z.infer<typeof GenerateNetflixSeriesPlanOutputSchema>;

export async function generateNetflixSeriesPlan(input: GenerateNetflixSeriesPlanInput): Promise<GenerateNetflixSeriesPlanOutput> {
  return await generateNetflixSeriesPlanFlow(input);
}

const generateNetflixSeriesPlanFlow = ai.defineFlow(
  {
    name: 'generateNetflixSeriesPlanFlow',
    inputSchema: GenerateNetflixSeriesPlanInputSchema,
    outputSchema: GenerateNetflixSeriesPlanOutputSchema,
  },
  async ({topic}) => {
    const { output } = await ai.generate({
        prompt: `You are a Netflix executive. For the topic "${topic}", create a plan for a new original series. It should feel like a premium, binge-worthy show.
        Your output must be a JSON object. Include keys for "topic", "style" (should be "Netflix Original"), "episodes" (typically 8-10), "duration" (e.g., "45-55 min each"), "quality" (e.g., "4K HDR"), "genre", a compelling "logline", and a "status" of "series plan generated".`,
        output: { schema: GenerateNetflixSeriesPlanOutputSchema },
    });

    return output!;
  }
);
