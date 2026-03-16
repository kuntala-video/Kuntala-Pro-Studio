"use client";

import { useState } from "react";
import { StoryGeneratorService } from "@/lib/story-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Wand2, Users, Film } from "lucide-react";
import type { StoryIdeaGeneratorOutput } from "@/lib/types";

export function StoryGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StoryIdeaGeneratorOutput | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const userRequest = formData.get("userRequest") as string;
    const ideaType = formData.get("ideaType") as "plot" | "character" | "scene" | "all";
    
    if (!userRequest) {
      toast({
        title: "Input required",
        description: "Please describe the story idea you're looking for.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await StoryGeneratorService.generateStoryIdea({ 
        userRequest,
        ideaType: ideaType === "all" ? undefined : ideaType,
      });
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: "An error occurred",
        description: "Failed to generate story ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="text-primary"/> AI Story Idea Generator</CardTitle>
        <CardDescription>Get plotlines, character concepts, or scene outlines for your animation.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="userRequest">Your Idea Prompt</Label>
            <Textarea
              id="userRequest"
              name="userRequest"
              placeholder="e.g., 'A story about a lost robot trying to find its way home in a fantasy world'"
              rows={4}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ideaType">Idea Type</Label>
            <Select name="ideaType" defaultValue="all" disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select an idea type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="plot">Plotlines</SelectItem>
                <SelectItem value="character">Characters</SelectItem>
                <SelectItem value="scene">Scenes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Ideas"
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-8">
            <h3 className="text-lg font-headline mb-4">Generated Ideas</h3>
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>
            <Accordion type="multiple" className="w-full mt-4" defaultValue={['plotlines', 'characterConcepts', 'sceneOutlines']}>
              {result.plotlines && result.plotlines.length > 0 && (
                <AccordionItem value="plotlines">
                  <AccordionTrigger><Wand2 className="mr-2 h-4 w-4 text-primary" />Plotlines</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      {result.plotlines.map((idea, index) => <li key={index}>{idea}</li>)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {result.characterConcepts && result.characterConcepts.length > 0 && (
                <AccordionItem value="characterConcepts">
                  <AccordionTrigger><Users className="mr-2 h-4 w-4 text-primary" />Character Concepts</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      {result.characterConcepts.map((idea, index) => <li key={index}>{idea}</li>)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {result.sceneOutlines && result.sceneOutlines.length > 0 && (
                <AccordionItem value="sceneOutlines">
                  <AccordionTrigger><Film className="mr-2 h-4 w-4 text-primary" />Scene Outlines</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      {result.sceneOutlines.map((idea, index) => <li key={index}>{idea}</li>)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
