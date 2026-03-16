'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Loader2 } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';

export default function RootPage() {
    const router = useRouter();
    const { user, userProfile, isLoading } = useUser();
    const { toast } = useToast();
    const hasChecked = useRef(false);

    const handleDisabledUser = useCallback(() => {
        toast({
            title: 'Access Revoked',
            description: 'Your account has been disabled by an administrator.',
            variant: 'destructive',
        });
        AuthService.signOut(auth, db).then(() => {
            router.replace('/login');
        });
    }, [router, toast]);

    useEffect(() => {
        // Safety timeout. If loading takes too long, redirect.
        const timer = setTimeout(() => {
            if (!hasChecked.current) {
                hasChecked.current = true; // Prevent other branches from running
                router.replace('/login');
            }
        }, 1200);

        // This block runs when the `useUser` hook has finished its initial load.
        if (!isLoading) {
            // We only want to run the redirection logic once.
            if (!hasChecked.current) {
                hasChecked.current = true; // Mark as checked
                clearTimeout(timer); // We resolved before the timeout, so clear it.

                if (user && userProfile) {
                    if (userProfile.disabled) {
                        handleDisabledUser();
                    } else {
                        const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';
                        const destination = isAdmin ? '/admin-dashboard' : '/guest';
                        router.replace(destination);
                    }
                } else {
                    // If loading is done and there's no valid user session, go to login.
                    router.replace('/login');
                }
            }
        }

        // Cleanup timer on component unmount
        return () => clearTimeout(timer);

    }, [isLoading, user, userProfile, router, handleDisabledUser]);

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Checking session...</p>
            </div>
        </div>
    );
}
