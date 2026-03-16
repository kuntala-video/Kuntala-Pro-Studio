'use client'

import { AlertTriangle, Home } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  // It's a good practice to log the error to a reporting service
  console.error(error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg text-center border-destructive">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <CardTitle className="mt-4 text-3xl font-headline">Application Error</CardTitle>
                <CardDescription>
                    Oops! Something went wrong.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    We've logged the issue. You can try to reload the component or go back to the main dashboard.
                </p>
                {error?.message && (
                    <div className="bg-muted/50 p-3 rounded-md text-left text-sm my-4">
                        <p className="font-bold text-destructive">Error Details:</p>
                        <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground mt-1">{error.message}</pre>
                    </div>
                )}
                <div className="flex justify-center gap-4 mt-6">
                    <Button variant="outline" onClick={() => reset()}>
                      Try Again
                    </Button>
                    <Button asChild>
                        <Link href="/">
                            <Home className="mr-2"/>
                            Go to Dashboard
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
