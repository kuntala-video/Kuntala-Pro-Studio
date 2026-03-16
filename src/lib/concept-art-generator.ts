'use server';

/**
 * @fileOverview Generates concept art for characters, environments, and props.
 * 
 * This helps establish the visual style of a project early on.
 */

export function generateConceptArt(prompt: string, style: string) {
  console.log(`Generating concept art for prompt: "${prompt}" in style: ${style}`);
  return {
    prompt,
    style,
    imageUrl: '/concept-art/generated-image.png',
  };
}
