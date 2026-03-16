import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';

let firebaseApp: FirebaseApp;

// Ensure that we initialize the app only once
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth: Auth = getAuth(firebaseApp);
const db: Firestore = getFirestore(firebaseApp);
const storage: FirebaseStorage = getStorage(firebaseApp);

// Export the singleton instances for use throughout the app
export { firebaseApp, db, auth, storage };
