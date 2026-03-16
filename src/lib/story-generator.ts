'use server';
/**
 * @fileOverview A Genkit flow for generating creative story ideas, including plots, characters, and scenes.
 *
 * - StoryGeneratorService - a service object with the generateStoryIdea function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { StoryIdeaGeneratorInput, StoryIdeaGeneratorOutput } from '@/lib/types';


const StoryIdeaGeneratorInputSchema = z.object({
  userRequest: z
    .string()
    .describe('A user-provided prompt or description of the kind of story idea they are looking for.'),
  ideaType: z
    .enum(['plot', 'character', 'scene'])
    .optional()
    .describe('The specific type of idea to generate. If not provided, all types will be generated.'),
  genre: z.string().optional().describe('The genre of the story (e.g., Sci-Fi, Fantasy, Comedy).'),
  length: z.enum(['short', 'medium', 'long']).optional().describe('The desired length of the story/script.'),
});

const StoryIdeaGeneratorOutputSchema = z.object({
  summary: z.string().describe('A brief, one-paragraph summary of the overall story concept.'),
  plotlines: z
    .array(z.string())
    .optional()
    .describe('An array of potential plot hooks or full plotline summaries based on the user request.'),
  characterConcepts: z
    .array(z.string())
    .optional()
    .describe('An array of interesting character concepts, including their motivations and conflicts.'),
  sceneOutlines: z
    .array(z.string())
    .optional()
    .describe('An array of detailed scene outlines, including setting, characters, and key actions.'),
});

async function generateStoryIdea(input: StoryIdeaGeneratorInput): Promise<StoryIdeaGeneratorOutput> {
    return await storyIdeaFlow(input);
}

const storyIdeaFlow = ai.defineFlow(
  {
    name: 'storyIdeaFlow',
    inputSchema: StoryIdeaGeneratorInputSchema,
    outputSchema: StoryIdeaGeneratorOutputSchema,
  },
  async (input) => {
    
    let promptText = `You are an expert creative writer and story consultant for an animation studio.
A user needs help generating ideas for a new story.

User's request: "${input.userRequest}"
`;

    if (input.genre) {
        promptText += `Genre: ${input.genre}\n`;
    }
    if (input.length) {
        promptText += `Desired Length: ${input.length}\n`;
    }

    promptText += `
Based on this request, generate a compelling story concept. Provide the following:
1.  A one-paragraph summary of the core story concept.
`;

    if (input.ideaType === 'plot' || !input.ideaType) {
        promptText += "2.  A few interesting plotline ideas or plot hooks.\n";
    }
    if (input.ideaType === 'character' || !input.ideaType) {
        promptText += "3.  A few unique character concepts with motivations.\n";
    }
    if (input.ideaType === 'scene' || !input.ideaType) {
        promptText += "4.  A few detailed scene outlines.\n";
    }

    promptText += "Please format your response according to the specified output schema."

    const { output } = await ai.generate({
        prompt: promptText,
        model: 'googleai/gemini-2.5-flash',
        output: { schema: StoryIdeaGeneratorOutputSchema },
    });

    return output!;
  }
);

export const StoryGeneratorService = {
    generateStoryIdea,
};
