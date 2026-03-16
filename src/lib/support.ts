'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
  type Auth,
} from 'firebase/firestore';
import { LoggerService } from './logger';

const createSupportTicket = async (
  db: Firestore,
  auth: Auth,
  subject: string,
  message: string
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to submit a support ticket.');
  }

  try {
    const ticketCollection = collection(db, 'supportTickets');
    await addDoc(ticketCollection, {
      userId: user.uid,
      email: user.email,
      subject,
      message,
      status: 'open',
      createdAt: serverTimestamp(),
    });
  } catch (error: any) {
    await LoggerService.logError(db, auth, error, { function: 'createSupportTicket' });
    throw new Error('Failed to create support ticket. Please try again later.');
  }
};

export const SupportService = {
  createSupportTicket,
};
