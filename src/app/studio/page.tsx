
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clapperboard, Loader2 } from "lucide-react";
import { StudioLayout } from "@/components/studio-layout";
import { useToast } from "@/hooks/use-toast";

export default function Studio(){

    const [topic,setTopic] = useState("")
    const [result,setResult] = useState<any>()
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const createFilm = async()=>{
        setIsLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/director",{
                method:"POST",
                headers: { 'Content-Type': 'application/json' },
                body:JSON.stringify({topic})
            })
            if (!res.ok) throw new Error('Failed to start film production');
            const data = await res.json()
            setResult(data)
            toast({ title: 'Production Started', description: `AI Director has started the process for "${topic}".` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }

    return(
        <StudioLayout>
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Clapperboard className="h-6 w-6 text-primary"/>AI Film Studio</CardTitle>
                    <CardDescription>Let the AI Director start the film production process for your topic.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="topic">Film Topic</Label>
                            <Input
                                id="topic"
                                placeholder="e.g., 'A lone astronaut on a mysterious planet'"
                                value={topic}
                                onChange={(e)=>setTopic(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button onClick={createFilm} className="w-full" disabled={isLoading || !topic}>
                            {isLoading ? <><Loader2 className="animate-spin mr-2"/> Starting...</> : 'Start Film Production'}
                        </Button>
                    </div>
                    {result && (
                        <div className="mt-6">
                            <h3 className="font-headline text-lg">Production Status</h3>
                            <Card className="mt-2 bg-muted/50">
                                <CardContent className="p-4">
                                    <pre className="text-sm whitespace-pre-wrap break-all">{JSON.stringify(result,null,2)}</pre>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </StudioLayout>
    )
}
