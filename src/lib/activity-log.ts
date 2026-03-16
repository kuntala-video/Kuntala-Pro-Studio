'use client';

import { collection, addDoc, serverTimestamp, type Auth, type Firestore } from 'firebase/firestore';
import { LoggerService } from './logger';

const logAdminAction = async (
    auth: Auth,
    firestore: Firestore,
    action: string,
    details: Record<string, any>
) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error("Cannot log action: no authenticated user.");
        return;
    }

    try {
        const logCollection = collection(firestore, 'activityLogs');
        await addDoc(logCollection, {
            actorUid: currentUser.uid,
            actorEmail: currentUser.email,
            action: action,
            details: details,
            timestamp: serverTimestamp(),
        });
    } catch (error: any) {
        // Log this error to Firestore itself, but with a different context.
        await LoggerService.logError(firestore, auth, error, { function: 'logAdminAction', action });
        // We probably don't want to throw an error here and interrupt the admin's flow
        // just because logging failed.
        console.error("Failed to write to activity log:", error);
    }
};

export const ActivityLogService = {
    logAdminAction,
};
