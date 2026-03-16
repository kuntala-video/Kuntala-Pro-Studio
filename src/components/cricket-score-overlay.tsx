'use client';

import type { CricketScore } from '@/lib/types';

interface CricketScoreOverlayProps {
  score: CricketScore;
  isVisible: boolean;
}

export function CricketScoreOverlay({ score, isVisible }: CricketScoreOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg text-lg font-sans shadow-lg animate-in fade-in-0 slide-in-from-bottom-5">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
                <span className="font-bold text-2xl mr-4">{score.team1Name}</span>
                <span className="text-2xl font-bold text-yellow-400">{score.runs}/{score.wickets}</span>
            </div>
            <div className="text-right">
                <span className="text-sm">{score.innings}</span>
                <p className="font-bold text-2xl">{score.overs}.{score.balls} Overs</p>
            </div>
        </div>
        <div className="w-full bg-white/20 h-px mb-2"></div>
        {score.target > 0 && (
            <div className="flex justify-center items-center text-center text-base">
                <p>Target: <span className="font-bold">{score.target}</span></p>
                <span className="mx-4">|</span>
                <p>{score.team2Name} needs <span className="font-bold text-yellow-400">{score.runsRequired}</span> runs in <span className="font-bold">{score.ballsRemaining}</span> balls</p>
            </div>
        )}
    </div>
  );
}
