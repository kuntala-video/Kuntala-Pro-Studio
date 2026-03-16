'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';

export default function SuperAdminOpenPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState('Authenticating super admin...');

    useEffect(() => {
        const loginSuperAdmin = async () => {
            if (!auth || !db) {
                setStatus('Firebase not ready. Retrying...');
                setTimeout(loginSuperAdmin, 1000);
                return;
            }

            // Use a hardcoded default super admin email and password.
            // This is more reliable for initial setup than environment variables.
            const email = 'kuntalavideo@gmail.com';
            const password = 'Password.123!';

            try {
                await AuthService.signIn(auth, db, email, password);
                setStatus('Authentication successful. Redirecting...');
                router.replace('/');

            } catch (error: any) {
                setStatus(`Authentication failed: ${error.message}`);
                toast({
                    title: 'Super Admin Login Failed',
                    description: error.message || 'An unknown error occurred.',
                    variant: 'destructive'
                });
                setTimeout(() => router.replace('/login'), 2000);
            }
        };

        loginSuperAdmin();
    }, [router, toast]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <ShieldCheck className="h-8 w-8 animate-pulse text-primary" />
                <p>{status}</p>
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </div>
    );
}
