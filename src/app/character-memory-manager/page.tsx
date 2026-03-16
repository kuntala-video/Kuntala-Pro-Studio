"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit } from 'lucide-react';
import { StudioLayout } from '@/components/studio-layout';

export default function CharacterMemoryManagerPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setResult(null);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;

        if (!name) {
            toast({ title: "Character name is required", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/character-memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error('Failed to lock memory');
            const data = await res.json();
            setResult(data);
            toast({ title: 'Character Memory Locked', description: `Memory for "${name}" has been locked.` });
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
                        <BrainCircuit className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-headline">Character Memory Manager</CardTitle>
                    <CardDescription>Lock key attributes of your character for consistency across episodes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Character Name</Label>
                            <Input id="name" name="name" placeholder="Enter the name of the character to lock" required disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Lock Character Memory'}
                        </Button>
                    </form>

                    {result && (
                        <div className="mt-6">
                            <h3 className="font-headline text-lg">Memory Lock Status</h3>
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
