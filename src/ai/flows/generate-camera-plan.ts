'use server';
/**
 * @fileOverview A Genkit flow for generating a cinematic camera plan.
 *
 * - generateCameraPlan - A function that handles camera plan generation.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCameraPlanInputSchema = z.object({
  scene: z.string().describe('The description of the scene.'),
});
type GenerateCameraPlanInput = z.infer<typeof GenerateCameraPlanInputSchema>;

const CameraMovementSchema = z.object({
    shotType: z.string().describe('e.g., "Establishing Shot", "Close-up", "Tracking Shot"'),
    description: z.string().describe('A brief description of the camera movement and what it captures.'),
    duration: z.number().describe('Approximate duration of the shot in seconds.'),
});

const GenerateCameraPlanOutputSchema = z.object({
    scene: z.string().describe('The original scene description.'),
    cameraStyle: z.string().describe('The overall camera style (e.g., "cinematic", "handheld").'),
    movements: z.array(CameraMovementSchema).describe('An array of camera movements for the scene.'),
});
type GenerateCameraPlanOutput = z.infer<typeof GenerateCameraPlanOutputSchema>;


export async function generateCameraPlan(input: GenerateCameraPlanInput): Promise<GenerateCameraPlanOutput> {
  return await generateCameraPlanFlow(input);
}

const generateCameraPlanFlow = ai.defineFlow(
  {
    name: 'generateCameraPlanFlow',
    inputSchema: GenerateCameraPlanInputSchema,
    outputSchema: GenerateCameraPlanOutputSchema,
  },
  async ({scene}) => {
    const { output } = await ai.generate({
        prompt: `You are an expert cinematographer. For the scene description "${scene}", create a dynamic and cinematic camera movement plan.
        Your output must be a JSON object that includes the overall style and an array of specific camera movements.`,
        output: { schema: GenerateCameraPlanOutputSchema },
    });

    return output!;
  }
);
