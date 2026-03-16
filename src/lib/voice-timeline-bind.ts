'use client';

import type { Project, TimelineTrack, VoiceRecording, TimelineAsset } from './types';

/**
 * Finds an available time slot at the end of a track.
 */
function findNextAvailableTime(track: TimelineTrack): number {
  if (!track.assets || track.assets.length === 0) {
    return 0;
  }
  const lastAsset = track.assets.reduce((last, current) => {
    return (last.start + last.duration) > (current.start + current.duration) ? last : current;
  });
  return lastAsset.start + lastAsset.duration;
}

/**
 * Binds a voice recording to a project's timeline.
 * It finds or creates a 'voice' track and adds the recording as a new asset.
 * This function is pure and returns the updated timeline structure.
 */
export function bindVoiceToTimeline(
  project: Project,
  voiceRecording: VoiceRecording
): TimelineTrack[] {
  // Deep copy to avoid direct mutation of the project state
  const newTimeline: TimelineTrack[] = project.timeline ? JSON.parse(JSON.stringify(project.timeline)) : [];
  
  let targetTrack = newTimeline.find((t: TimelineTrack) => t.type === 'voice');
  
  // If no voice track exists, create one and add it to the timeline.
  if (!targetTrack) {
    targetTrack = {
      id: `track-voice-${Date.now()}`,
      name: 'Voice Over',
      type: 'voice',
      assets: [],
    };
    newTimeline.push(targetTrack);
  }
  
  // Find the next available start time on the track
  const startTime = findNextAvailableTime(targetTrack);
  
  const newAsset: TimelineAsset = {
    id: `tl-asset-${voiceRecording.id}`,
    assetId: voiceRecording.id, // Reference to the original asset
    start: startTime,
    duration: voiceRecording.duration,
  };
  
  // Add the new asset reference to the track
  targetTrack.assets.push(newAsset);
  
  return newTimeline;
}

export const VoiceTimelineBinder = {
    bindVoiceToTimeline,
};
