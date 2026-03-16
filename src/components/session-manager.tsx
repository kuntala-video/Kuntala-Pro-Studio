'use client';

import { useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { useInactivityTimer } from '@/hooks/use-inactivity-timer';
import { SessionTimeoutDialog } from '@/components/session-timeout-dialog';
import { AuthService } from '@/lib/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const IDLE_TIME_MINUTES = 30;
const WARNING_TIME_MINUTES = 5; // Show dialog 5 minutes before logging out

export function SessionManager() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = useCallback(() => {
    if (auth.currentUser) { 
      toast({
        title: 'Session Expired',
        description: 'You have been logged out due to inactivity.',
      });
      AuthService.signOut(auth, db).then(() => {
        router.push('/login');
      });
    }
  }, [router, toast]);

  const { isWarningVisible, extendSession } = useInactivityTimer({
    onIdle: handleLogout,
    idleTime: IDLE_TIME_MINUTES,
    warningTime: WARNING_TIME_MINUTES,
  });

  // Don't render anything if there is no user session
  if (!user) {
    return null;
  }
  
  return (
    <SessionTimeoutDialog
      isOpen={isWarningVisible}
      onContinue={extendSession}
      onLogout={handleLogout}
      countdownSeconds={WARNING_TIME_MINUTES * 60}
    />
  );
}
