'use client';

import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthService } from '@/lib/auth';
import { db, auth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

export function StudioLayout({ children, noPadding = false }: { children: React.ReactNode, noPadding?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    
    // If loading is done and there's no user, redirect to login.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // If there is a user and their profile shows they are disabled, log them out.
    // This handles the case where an admin disables an active session in real-time.
    if (userProfile && userProfile.disabled) {
      toast({ title: "Access Revoked", description: "Your account has been disabled by an administrator.", variant: "destructive" });
      AuthService.signOut(auth, db).then(() => {
        router.replace('/login');
      });
    }
  }, [user, userProfile, isLoading, router, toast]);

  // Only show a full-page loader if we're still waiting for the initial auth state
  // and don't have a user object yet.
  if (isLoading && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If loading is complete but there's no user, the effect above will redirect.
  // Show a loader in the meantime.
  if (!user) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // At this point, we have a user object, so we can render the layout shell.
  // The userProfile might still be loading, but pages should handle that.
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader />
          <main className={cn("flex-1 overflow-auto", !noPadding && "p-4 md:p-6 lg:p-8")}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
