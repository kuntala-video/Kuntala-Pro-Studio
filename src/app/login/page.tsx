'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AuthService } from '@/lib/auth';
import { Logo } from '@/components/icons';
import { auth, db } from '@/lib/firebase';
import { useUser } from '@/hooks/use-user';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user, userProfile, isLoading } = useUser();

  // This effect handles redirecting a user who is already logged in when they visit the login page.
  useEffect(() => {
    // Wait until the user status is confirmed
    if (!isLoading && user && userProfile) {
      // User is fully authenticated and has a profile, they don't belong on the login page.
      const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';
      const destination = isAdmin ? '/admin-dashboard' : '/guest';
      router.replace(destination);
    }
  }, [user, userProfile, isLoading, router]);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
        await AuthService.signIn(auth, db, email, password);
        // After successful sign-in, redirect to the root page.
        // The root page's logic (or the layout's logic via the useUser hook)
        // will handle redirecting to the correct dashboard based on the user's role.
        router.replace('/');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  // If we're still loading the user state, or if the user is already logged in,
  // we show a loader to prevent the login form from flashing unnecessarily.
  if (isLoading || (user && userProfile)) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-orange-500 via-white to-green-600 p-[4px] shadow-xl">
            <Logo className="h-full w-full rounded-full" />
          </div>
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your studio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !email || !password}>
              {isSubmitting ? "Authenticating..." : "Enter Studio"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/request-access" className="underline">
              Request Access
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
