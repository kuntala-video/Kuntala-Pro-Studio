'use client';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  type Firestore,
  addDoc,
} from 'firebase/firestore';
import { type Auth } from 'firebase/auth';
import { LoggerService } from './logger';
import type { PaymentRequest } from './types';
import { ActivityLogService } from './activity-log';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const getPaymentRequests = async (db: Firestore): Promise<PaymentRequest[]> => {
    try {
        const requestsQuery = query(collection(db, 'paymentRequests'));
        const querySnapshot = await getDocs(requestsQuery);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRequest[];
    } catch (error: any) {
        const permissionError = new FirestorePermissionError({
            path: 'paymentRequests',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        // Return an empty array on error to prevent breaking the calling component,
        // while the contextual error is displayed by the global listener.
        return [];
    }
};

const updatePaymentRequestStatus = (
  db: Firestore,
  auth: Auth,
  requestId: string,
  status: 'pending' | 'approved' | 'rejected'
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated.');
  }
  const requestDocRef = doc(db, 'paymentRequests', requestId);
  const updates = {
      status: status,
      updatedAt: serverTimestamp(),
  };

  updateDoc(requestDocRef, updates)
    .then(() => {
        ActivityLogService.logAdminAction(auth, db, 'payment_request_status_changed', { requestId, newStatus: status });
    })
    .catch(async (serverError) => {
        const errorData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        const permissionError = new FirestorePermissionError({
            path: requestDocRef.path,
            operation: 'update',
            requestResourceData: errorData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};

const createPaymentRequest = async (
  db: Firestore,
  auth: Auth,
  data: {
    fullName: string;
    email: string;
    whatsapp: string;
    plan: string;
    amount: number;
    screenshotUrl?: string;
    transactionId: string;
  }
) => {
  const user = auth.currentUser;
  if (!user) {
    // This should ideally not happen if the page logic correctly waits for an anonymous user.
    // However, as a safeguard, we'll throw an error that the UI can catch.
    const error = new Error('User session not found. Please refresh and try again.');
    await LoggerService.logError(db, auth, error, { function: 'createPaymentRequest', detail: 'Attempted to create request without any user session.' });
    throw error;
  }
  
  const requestsCollection = collection(db, 'paymentRequests');
  const docData = {
    ...data,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    createdByUid: user.uid, // Log which anonymous user created it
  };

  try {
    const docRef = await addDoc(requestsCollection, docData);

    // Create an admin notification
    const notificationsCollection = collection(db, 'admin_notifications');
    await addDoc(notificationsCollection, {
        type: 'payment_request',
        referenceId: docRef.id,
        message: `New payment request from ${data.fullName} for the ${data.plan} plan.`,
        isRead: false,
        createdAt: serverTimestamp(),
    });

  } catch (serverError) {
        // Prepare data that would have been sent for the error context
        const errorData = {
            ...docData,
            createdAt: new Date().toISOString(), // Use client time for the error report
        };
        // Create the detailed, contextual error
        const permissionError = new FirestorePermissionError({
            path: 'paymentRequests',
            operation: 'create',
            requestResourceData: errorData,
        });
        // Emit the error globally so the listener can catch and display it
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw the original error to be caught by the form handler
  }
};

export const PaymentRequestService = {
    getPaymentRequests,
    updatePaymentRequestStatus,
    createPaymentRequest
};
