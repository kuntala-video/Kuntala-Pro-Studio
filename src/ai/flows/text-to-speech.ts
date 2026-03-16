'use server';
/**
 * @fileOverview A Genkit flow for converting text into speech using a TTS model.
 *
 * - textToSpeech - A function that handles the text-to-speech conversion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';
import type { TextToSpeechInput, TextToSpeechOutput } from '@/lib/types';

const TextToSpeechInputSchema = z.object({
  textToSynthesize: z.string().describe('The text to be converted into speech.'),
  voice: z.string().optional().describe('The name of the prebuilt voice to use for synthesis.'),
});

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated speech as a data URI, including MIME type and Base64 encoding.'),
});

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  try {
    return await textToSpeechFlow(input);
  } catch (error: any) {
    console.error("Error in textToSpeech flow:", error);
    throw new Error('Failed to generate audio from the AI model. Please try again.');
  }
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voice || 'Algenib' },
          },
        },
      },
      prompt: input.textToSynthesize,
    });

    if (!media || !media.url) {
      throw new Error('No media returned from the text-to-speech model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
