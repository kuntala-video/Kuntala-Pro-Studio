'use client';

/**
 * Generates an array of random numbers to simulate waveform bar heights.
 * This provides a lightweight visual representation without heavy processing.
 * @param duration The duration of the audio clip in seconds.
 * @returns An array of numbers between 0 and 1.
 */
export function generateWaveformData(duration: number): number[] {
  // Generate a number of bars proportional to the duration for a dynamic feel.
  const numBars = Math.max(10, Math.floor(duration * 5));
  const values = Array.from({ length: numBars }, () => Math.random());
  return values;
}
