'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SignupRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // This page is obsolete. The primary way to get an account is via the
        // access request flow. This page now just redirects there.
        router.replace('/request-access');
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Redirecting to Access Request...</p>
            </div>
        </div>
    );
}
