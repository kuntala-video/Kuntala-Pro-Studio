'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { generateWaveformData } from '@/lib/audio-waveform';

interface WaveformPreviewProps {
  duration: number; // in seconds
  className?: string;
}

/**
 * A lightweight component to display a simulated audio waveform.
 */
export function WaveformPreview({ duration, className }: WaveformPreviewProps) {
  const bars = useMemo(() => generateWaveformData(duration), [duration]);

  return (
    <div className={cn("absolute inset-0 flex items-center justify-between w-full h-full px-1 overflow-hidden pointer-events-none", className)}>
      {bars.map((height, i) => (
        <div
          key={i}
          className="bg-primary/40 rounded-sm"
          style={{
            height: `${20 + height * 60}%`, // Vary height between 20% and 80%
            width: '2px', // Fixed width for each bar
          }}
        />
      ))}
    </div>
  );
}
