'use client';

import { ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import { LoggerService } from './logger';

/**
 * Uploads a file blob to Firebase Storage and returns the download URL.
 * @param storage The Firebase Storage instance.
 * @param auth The Firebase Auth instance.
 * @param db The Firestore instance.
 * @param blob The file blob to upload.
 * @param path The path in storage to upload to (e.g., 'videos', 'images').
 * @param fileName A specific file name for the upload. A unique one is generated if not provided.
 * @returns The public download URL of the uploaded file.
 */
export async function uploadFile(
  storage: FirebaseStorage,
  auth: Auth,
  db: Firestore,
  blob: Blob,
  path: string = 'uploads',
  fileName?: string
): Promise<string> {
  const user = auth.currentUser;

  // Paths that can be written to by any authenticated user (including anonymous)
  const publicWritePaths = ['payment-screenshots', 'qr-codes'];

  // For other paths, a non-anonymous user is required
  if (!user && !publicWritePaths.includes(path)) {
    throw new Error('User must be fully authenticated to upload to this path.');
  }
  
  // For user-specific paths, ensure we have a UID.
  if (!publicWritePaths.includes(path) && (!user || user.isAnonymous)) {
    throw new Error('A non-anonymous user is required for this upload path.');
  }

  try {
    const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Handle user-specific vs global paths
    let fullPath: string;
    if (publicWritePaths.includes(path)) {
        fullPath = `${path}/${finalFileName}`;
    } else {
        if (!user) throw new Error('A logged-in user is required for this upload path.');
        fullPath = `${path}/${user.uid}/${finalFileName}`;
    }

    const storageRef = ref(storage, fullPath);

    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    await LoggerService.logError(db, auth, error, {
      function: 'uploadFile',
      userId: user?.uid,
      path,
    });
    throw new Error('Failed to upload file. Please try again.');
  }
}
