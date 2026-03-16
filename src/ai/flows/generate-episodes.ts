'use server';
/**
 * @fileOverview A Genkit flow for generating a list of episodes for a series.
 *
 * - generateEpisodes - A function that handles episode list generation.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEpisodesInputSchema = z.object({
  title: z.string().describe('The title of the series.'),
  total: z.number().int().positive().describe('The total number of episodes to generate.'),
});
type GenerateEpisodesInput = z.infer<typeof GenerateEpisodesInputSchema>;

const EpisodeSchema = z.object({
    episode: z.number().int(),
    title: z.string(),
});

const GenerateEpisodesOutputSchema = z.array(EpisodeSchema);
type GenerateEpisodesOutput = z.infer<typeof GenerateEpisodesOutputSchema>;

export async function generateEpisodes(input: GenerateEpisodesInput): Promise<GenerateEpisodesOutput> {
  return await generateEpisodesFlow(input);
}

const generateEpisodesFlow = ai.defineFlow(
  {
    name: 'generateEpisodesFlow',
    inputSchema: GenerateEpisodesInputSchema,
    outputSchema: GenerateEpisodesOutputSchema,
  },
  async ({title, total}) => {
    const { output } = await ai.generate({
        prompt: `You are a TV series writer. For a series titled "${title}", generate a list of ${total} compelling episode titles. The titles should suggest an overarching story arc.
        Your output must be a JSON array of objects, each with "episode" (number) and "title" (string) keys.`,
        output: { schema: GenerateEpisodesOutputSchema },
    });

    return output!;
  }
);
