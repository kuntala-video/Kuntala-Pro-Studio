
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";
import { StudioLayout } from "@/components/studio-layout";
import { useToast } from "@/hooks/use-toast";

export default function Automation(){

    const [topic,setTopic] = useState("")
    const [result,setResult] = useState<any>()
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const run = async()=>{
        setIsLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/youtube-auto",{
                method:"POST",
                headers: { 'Content-Type': 'application/json' },
                body:JSON.stringify({topic})
            })
            if (!res.ok) throw new Error('Failed to run automation');
            const data = await res.json()
            setResult(data)
            toast({ title: "Automation Complete", description: "The automation pipeline has finished."});
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
                    <CardTitle className="font-headline flex items-center gap-2"><Bot className="h-6 w-6 text-primary"/>AI YouTube Automation</CardTitle>
                    <CardDescription>Enter a topic to automatically generate and (soon) upload a video.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="topic">Video Topic</Label>
                            <Input
                                id="topic"
                                placeholder="e.g., 'The Future of Artificial Intelligence'"
                                value={topic}
                                onChange={(e)=>setTopic(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button onClick={run} className="w-full" disabled={isLoading || !topic}>
                        {isLoading ? <><Loader2 className="animate-spin mr-2"/> Processing...</> : 'Run Automation'}
                        </Button>
                    </div>

                    {result && (
                        <div className="mt-6">
                            <h3 className="font-headline text-lg">Automation Result</h3>
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
