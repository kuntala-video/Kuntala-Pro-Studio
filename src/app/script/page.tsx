'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { StudioLayout } from '@/components/studio-layout';

export default function ScriptPage() {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (!topic) {
      toast({
        title: 'Topic is required',
        description: 'Please enter a topic for your video script.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setScript('');

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate script from the API.');
      }

      const data = await res.json();
      setScript(data.script);
      toast({
        title: 'Script Generated',
        description: 'Your script is ready below.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudioLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4">
          AI Script Writer
        </h1>
        <p className="text-muted-foreground mb-8">
          Enter a topic and let our AI generate a basic script outline for your video.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Script Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Enter your video topic, e.g., 'The History of Animation'"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button onClick={generate} disabled={isLoading || !topic}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  'Generate Script'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {(isLoading || script) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Generated Script</CardTitle>
              <CardDescription>
                You can copy this script or use it as inspiration.
              </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {script && (
                    <Textarea
                        readOnly
                        value={script}
                        className="font-mono bg-muted/50 h-96 text-base"
                    />
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </StudioLayout>
  );
}
