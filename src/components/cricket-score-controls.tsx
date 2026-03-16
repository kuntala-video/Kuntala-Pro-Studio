'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CricketScore } from '@/lib/types';
import { Trophy } from 'lucide-react';

interface CricketScoreControlsProps {
  score: CricketScore;
  onScoreChange: (score: CricketScore) => void;
  isEnabled: boolean;
}

export function CricketScoreControls({ score, onScoreChange, isEnabled }: CricketScoreControlsProps) {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    
    onScoreChange({
      ...score,
      [name]: isNaN(numValue) ? value : numValue,
    });
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Trophy/> Live Cricket Score</CardTitle>
        <CardDescription>Update the live score overlay instantly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="team1Name">Team 1 Name</Label>
                <Input id="team1Name" name="team1Name" value={score.team1Name} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="team2Name">Team 2 Name</Label>
                <Input id="team2Name" name="team2Name" value={score.team2Name} onChange={handleChange} />
            </div>
        </div>

        <div className="grid gap-2">
            <Label htmlFor="innings">Innings</Label>
            <Input id="innings" name="innings" value={score.innings} onChange={handleChange} placeholder="e.g., 1st Innings"/>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="runs">Runs</Label>
                <Input id="runs" name="runs" type="number" value={score.runs} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="wickets">Wickets</Label>
                <Input id="wickets" name="wickets" type="number" value={score.wickets} onChange={handleChange} />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="overs">Overs</Label>
                <Input id="overs" name="overs" type="number" value={score.overs} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="balls">Balls</Label>
                <Input id="balls" name="balls" type="number" value={score.balls} onChange={handleChange} />
            </div>
        </div>
        
         <div className="grid gap-2">
            <Label htmlFor="target">Target</Label>
            <Input id="target" name="target" type="number" value={score.target} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="runsRequired">Runs Required</Label>
                <Input id="runsRequired" name="runsRequired" type="number" value={score.runsRequired} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="ballsRemaining">Balls Remaining</Label>
                <Input id="ballsRemaining" name="ballsRemaining" type="number" value={score.ballsRemaining} onChange={handleChange} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
