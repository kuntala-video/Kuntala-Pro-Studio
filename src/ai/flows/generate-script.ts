'use server';
/**
 * @fileOverview A Genkit flow for generating a script from a topic.
 *
 * - generateScript - A function that handles script generation.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateScriptInputSchema = z.object({
  topic: z.string().describe('The topic for the script.'),
});
type GenerateScriptInput = z.infer<typeof GenerateScriptInputSchema>;

const GenerateScriptOutputSchema = z.object({
    script: z.string().describe('The generated script text, including scene headings and dialogue.'),
});
type GenerateScriptOutput = z.infer<typeof GenerateScriptOutputSchema>;

export async function generateScript(input: GenerateScriptInput): Promise<GenerateScriptOutput> {
  return await generateScriptFlow(input);
}

const generateScriptFlow = ai.defineFlow(
  {
    name: 'generateScriptFlow',
    inputSchema: GenerateScriptInputSchema,
    outputSchema: GenerateScriptOutputSchema,
  },
  async ({topic}) => {
    const { output } = await ai.generate({
        prompt: `You are a professional screenwriter. Write a short script outline for a video about "${topic}". The script should have a title, scene headings (e.g., SCENE 1), brief action descriptions, and some sample dialogue if applicable. The tone should be engaging and cinematic. Your output MUST be a JSON object with a single key "script" that contains the full script as a string.`,
        output: { schema: GenerateScriptOutputSchema },
    });

    return output!;
  }
);
