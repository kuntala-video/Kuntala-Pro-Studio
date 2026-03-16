'use server';

/**
 * @fileOverview Manages the composition of visual effects (VFX) into scenes.
 * 
 * This module is responsible for layering effects like explosions, magic, or weather.
 */

export function addVfxToScene(sceneId: string, effectName: 'explosion' | 'magic-spell' | 'rain') {
  console.log(`Adding VFX effect "${effectName}" to scene ${sceneId}`);
  return {
    sceneId,
    effect: effectName,
    status: 'vfx-queued',
  };
}
