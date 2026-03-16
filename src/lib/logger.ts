'use client';

import { collection, addDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { type Auth } from 'firebase/auth';

/**
 * Logs a critical error to the Firestore 'systemLogs' collection.
 * This should be used in catch blocks for unexpected, critical errors.
 */
const logErrorToFirestore = async (
  db: Firestore,
  auth: Auth,
  error: Error,
  context: Record<string, any> = {}
) => {
  try {
    const currentUser = auth.currentUser;
    const logCollection = collection(db, 'systemLogs');
    
    // Firestore does not allow `undefined` values. We clean the context object.
    const sanitizedContext = Object.fromEntries(
        Object.entries(context).filter(([, v]) => v !== undefined)
    );
    
    const logData = {
      level: 'error' as const,
      message: error.message,
      context: sanitizedContext,
      timestamp: serverTimestamp(),
      uid: currentUser?.uid || 'anonymous',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : context.url || 'server',
      ...(error.stack && { stack: error.stack }),
    };

    await addDoc(logCollection, logData);
  } catch (loggingError) {
    // If logging itself fails, log to console to not lose the error info.
    console.error("CRITICAL: Failed to log error to Firestore.", loggingError);
    console.error("Original Error:", error);
  }
};

export const LoggerService = {
    logError: logErrorToFirestore,
};
