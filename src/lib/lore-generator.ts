'use server';

/**
 * @fileOverview Generates background lore, history, and mythology for a story world.
 * 
 * This can be used to add depth and richness to the narrative.
 */

export function generateLore(topic: string, depth: 'shallow' | 'deep') {
  console.log(`Generating ${depth} lore for topic: "${topic}"`);
  return {
    topic,
    lore: 'A long time ago, in a galaxy far, far away...',
  };
}
