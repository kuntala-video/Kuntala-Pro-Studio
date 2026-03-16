"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Scissors } from "lucide-react";

export function TimelineEditor() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState([0]);
    const maxTime = 100; // Represents 100 frames or seconds

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Scissors className="text-primary" /> Timeline
                </CardTitle>
                <CardDescription>
                    Control your animation's playback and timing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handlePlayPause}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex-grow flex items-center gap-2">
                        <span className="text-xs font-mono w-12 text-center">{currentTime[0]}</span>
                         <Slider
                            value={currentTime}
                            onValueChange={setCurrentTime}
                            max={maxTime}
                            step={1}
                        />
                         <span className="text-xs font-mono w-12 text-center">{maxTime}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
