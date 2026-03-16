'use server';

/**
 * @fileOverview Manages the lore, rules, and consistency of the story world.
 * 
 * This module helps in generating and maintaining a coherent fictional universe.
 */

export function defineWorldRule(rule: string) {
  console.log(`Defining new world rule: "${rule}"`);
  return {
    rule,
    status: 'world-rule-saved',
  };
}
