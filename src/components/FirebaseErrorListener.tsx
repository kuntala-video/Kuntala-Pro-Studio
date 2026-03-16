'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It logs the error to the console for developers but does not crash the app,
 * allowing components to fall back to an empty or error state.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log the detailed error to the console for developers to debug security rules.
      console.error(error);
      
      // The user requested silent logging for permission errors.
      // A toast could be added here if some user feedback is desired, but for now,
      // we will just log to console and let the UI show an empty state.
      // Example toast:
      // toast({
      //   variant: "destructive",
      //   title: "Permission Denied",
      //   description: "A background data operation was blocked. Some content may not be visible.",
      // });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // This component renders nothing.
  return null;
}
