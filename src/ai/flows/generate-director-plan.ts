'use server';
/**
 * @fileOverview A Genkit flow for generating a film production plan.
 *
 * - generateDirectorPlan - A function that handles plan generation.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDirectorPlanInputSchema = z.object({
  topic: z.string().describe('The topic for the film.'),
});
type GenerateDirectorPlanInput = z.infer<typeof GenerateDirectorPlanInputSchema>;

const GenerateDirectorPlanOutputSchema = z.object({
    director: z.string().describe('The AI director persona.'),
    topic: z.string().describe('The topic of the film.'),
    steps: z.array(z.string()).describe('A list of production steps.'),
    status: z.string().describe('The initial status of the production.'),
});
type GenerateDirectorPlanOutput = z.infer<typeof GenerateDirectorPlanOutputSchema>;

export async function generateDirectorPlan(input: GenerateDirectorPlanInput): Promise<GenerateDirectorPlanOutput> {
  return await generateDirectorPlanFlow(input);
}

const generateDirectorPlanFlow = ai.defineFlow(
  {
    name: 'generateDirectorPlanFlow',
    inputSchema: GenerateDirectorPlanInputSchema,
    outputSchema: GenerateDirectorPlanOutputSchema,
  },
  async ({topic}) => {
    const { output } = await ai.generate({
        prompt: `You are an AI Film Director. For the topic "${topic}", create a high-level production plan.
        Your output must be a JSON object with the following keys:
        - "director": Your persona, which is "AI Director".
        - "topic": The topic you were given.
        - "steps": An array of strings representing the key production steps (e.g., "Generate Script", "Create Characters", "Render Scenes").
        - "status": The initial status, which should be "film production started".
        `,
        output: { schema: GenerateDirectorPlanOutputSchema },
    });

    return output!;
  }
);
