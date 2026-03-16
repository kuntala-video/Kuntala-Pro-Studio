'use client';

import { FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit">
                    <FileQuestion className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4 text-3xl font-headline">404 - Page Not Found</CardTitle>
                <CardDescription>
                    The page you are looking for does not exist.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    It might have been moved or deleted. Let's get you back on track.
                </p>
                <Button asChild>
                    <Link href="/">
                        Go to Homepage
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
