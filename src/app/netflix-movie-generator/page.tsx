"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Tv } from 'lucide-react';
import { StudioLayout } from '@/components/studio-layout';

export default function NetflixMovieGeneratorPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setResult(null);

        const formData = new FormData(event.currentTarget);
        const topic = formData.get('topic') as string;

        if (!topic) {
            toast({ title: "Topic is required", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/netflix-movie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            if (!res.ok) throw new Error('Failed to generate movie plan');
            const data = await res.json();
            setResult(data);
            toast({ title: 'Netflix-style Series Plan Generated', description: `Plan generated for "${topic}".` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <StudioLayout>
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Tv className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-headline">AI Netflix Series Generator</CardTitle>
                    <CardDescription>Generate a plan for a full series with a Netflix-style feel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="topic">Series Topic</Label>
                            <Input id="topic" name="topic" placeholder="e.g., 'A haunted house in colonial India'" required disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Generate Series Plan'}
                        </Button>
                    </form>

                    {result && (
                        <div className="mt-6">
                            <h3 className="font-headline text-lg">Generated Series Plan</h3>
                            <Card className="mt-2 bg-muted/50">
                                <CardContent className="p-4">
                                    <pre className="text-sm whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </StudioLayout>
    );
}
