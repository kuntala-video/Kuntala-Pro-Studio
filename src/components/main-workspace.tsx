"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimationWorkspace } from "@/components/animation-workspace";
import { StoryGenerator } from "@/components/story-generator";
import { CartoonStylizer } from "@/components/cartoon-stylizer";
import { VideoConverter } from "@/components/video-converter";
import { LiveStreamer } from "@/components/live-streamer";
import { VoiceStudio } from "@/components/voice-studio";
import { Clapperboard, Sparkles, Image as ImageIcon, Mic, Film, Radio } from "lucide-react";

export function MainWorkspace() {
  return (
    <Tabs defaultValue="animation" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 max-w-5xl mx-auto">
        <TabsTrigger value="animation">
          <Clapperboard className="w-4 h-4 mr-2" />
          Animation
        </TabsTrigger>
        <TabsTrigger value="story-generator">
          <Sparkles className="w-4 h-4 mr-2" />
          Story AI
        </TabsTrigger>
        <TabsTrigger value="cartoon-stylizer">
          <ImageIcon className="w-4 h-4 mr-2" />
          Stylizer AI
        </TabsTrigger>
        <TabsTrigger value="voice-studio">
          <Mic className="w-4 h-4 mr-2" />
          Voice Studio
        </TabsTrigger>
        <TabsTrigger value="video-converter">
          <Film className="w-4 h-4 mr-2" />
          Converter
        </TabsTrigger>
        <TabsTrigger value="live-stream">
          <Radio className="w-4 h-4 mr-2" />
          Live Stream
        </TabsTrigger>
      </TabsList>
      <TabsContent value="animation">
        <AnimationWorkspace />
      </TabsContent>
      <TabsContent value="story-generator">
        <StoryGenerator />
      </TabsContent>
      <TabsContent value="cartoon-stylizer">
        <CartoonStylizer />
      </TabsContent>
       <TabsContent value="voice-studio">
        <VoiceStudio />
      </TabsContent>
       <TabsContent value="video-converter">
        <VideoConverter />
      </TabsContent>
       <TabsContent value="live-stream">
        <LiveStreamer />
      </TabsContent>
    </Tabs>
  );
}
