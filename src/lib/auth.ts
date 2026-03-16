'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type Auth,
  type User,
  type UserCredential,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, addDoc, collection, deleteDoc, type Firestore, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import type { UserProfile, UserPermissions } from './types';
import { LoggerService } from './logger';
import { ActivityLogService } from './activity-log';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const signIn = async (auth: Auth, db: Firestore, email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    // Log any sign-in error
    await LoggerService.logError(db, auth, error, { function: 'signIn', email });

    // Handle specific auth errors with user-friendly messages
    if (error.code === 'auth/user-disabled') {
      throw new Error('Access Revoked: Your account has been disabled by an administrator.');
    }
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password.');
    }
    
    // Generic fallback for any other errors
    throw new Error('An unknown error occurred during login.');
  }
};


const signOut = async (auth: Auth, db: Firestore) => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    await LoggerService.logError(db, auth, error, { function: 'signOut' });
    console.error("Error during sign out:", error);
  }
};

const signUp = async (auth: Auth, db: Firestore, email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // The onAuthStateChanged listener in useUser hook is now the single source of truth
    // for creating the Firestore user profile. This function is only responsible
    // for creating the Firebase Auth user.
    return userCredential.user;
  } catch (error: any) {
    await LoggerService.logError(db, auth, error, { function: 'signUp', email });
    throw new Error('Failed to create account. Please try again later.');
  }
};

// --- Admin Functions ---

const createUser = async (auth: Auth, db: Firestore, userData: { email: string; password: string; role: UserProfile['role']; displayName?: string; plan?: UserProfile['plan']; subscriptionEnd?: Date; wallet?: UserProfile['wallet']; phone?: string; }) => {
    const { email, password, role, displayName, plan: newPlan, subscriptionEnd, wallet, phone } = userData;

    // Use a temporary app to create the user without signing out the admin.
    const tempApp = initializeApp(getApp().options, `temp-create-${Date.now()}`);
    const tempAuth = getAuth(tempApp);
    const adminUid = auth.currentUser?.uid;

    let user: User;

    try {
        const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
        user = userCredential.user;
    } catch (error: any) {
        await LoggerService.logError(db, auth, error, { function: 'createUser:Auth', createdEmail: email });
        await deleteApp(tempApp); // Clean up on auth failure
        throw new Error(`Failed to create authentication record for user. ${error.message}`);
    }

    // Now, create the Firestore document using the ADMIN's permissions.
    const userProfileRef = doc(db, 'users', user.uid);
    const plan = newPlan || (role === 'staff' ? 'yearly' : 'free');
    
    const isPrivileged = role === 'staff' || role === 'admin' || role === 'super_admin';
    const permissions: UserPermissions = {
        animation: true,
        reels: true,
        voiceClone: isPrivileged || plan === 'quarterly' || plan === 'yearly' || plan === 'enterprise',
        avatar: isPrivileged || plan === 'yearly' || plan === 'enterprise',
        cinematic: isPrivileged || plan === 'enterprise',
    };

    const profileData: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || '',
        role: role,
        plan: plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        disabled: false,
        permissions: permissions,
        wallet: wallet || { credits: role === 'subscriber' ? 100 : (isPrivileged ? 10000 : 500), spent: 0 },
        createdBy: adminUid,
        ...(subscriptionEnd && { subscriptionEnd: subscriptionEnd }),
        ...(phone && { phone }),
    };

    try {
        await setDoc(userProfileRef, profileData);
        await ActivityLogService.logAdminAction(auth, db, 'user_created_by_admin', { createdUserEmail: email, role: role, plan: plan });
        
        await firebaseSignOut(tempAuth);
        await deleteApp(tempApp);
        return { user };
    } catch (serverError: any) {
        const errorContextData = { ...profileData } as any;
        if (errorContextData.createdAt) errorContextData.createdAt = new Date().toISOString();
        if (errorContextData.updatedAt) errorContextData.updatedAt = new Date().toISOString();

        const permissionError = new FirestorePermissionError({
            path: userProfileRef.path,
            operation: 'create',
            requestResourceData: errorContextData,
        });
        errorEmitter.emit('permission-error', permissionError);

        await LoggerService.logError(db, auth, serverError, { function: 'createUser:Firestore', createdEmail: email });

        await firebaseSignOut(tempAuth);
        await deleteApp(tempApp);
        
        throw new Error(`Auth user created, but failed to create profile in Firestore. Check permissions. Original error: ${serverError.message}`);
    }
};


const updateUserRole = async (db: Firestore, auth: Auth, uid: string, role: string) => {
    try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { role });
    } catch(error: any) {
        await LoggerService.logError(db, auth, error, { function: 'updateUserRole', targetUid: uid, newRole: role });
        throw new Error('Failed to update user role.');
    }
};

const sendPasswordResetEmailToUser = async (auth: Auth, db: Firestore, email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
        await ActivityLogService.logAdminAction(auth, db, 'password_reset_sent', { targetUserEmail: email });
    } catch(error: any) {
        await LoggerService.logError(db, auth, error, { function: 'sendPasswordResetEmailToUser', targetEmail: email });
        throw new Error('Failed to send password reset email.');
    }
}

const changePassword = async (auth: Auth, db: Firestore, currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;

    if (!user || !user.email) {
        throw new Error("No user is currently signed in.");
    }
    
    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        await ActivityLogService.logAdminAction(auth, db, 'password_changed', { forUser: user.uid });
    } catch(error: any) {
        await LoggerService.logError(db, auth, error, { function: 'changePassword', forUser: user.uid });
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-mismatch' || error.code === 'auth/invalid-credential') {
            throw new Error('The current password you entered is incorrect.');
        }
        throw new Error('Failed to change password. Please try again.');
    }
}

async function getUserRole(db: Firestore, uid: string) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.data()?.role;
}

const getAllUsers = async (db: Firestore): Promise<UserProfile[]> => {
    try {
        const usersQuery = query(collection(db, 'users'), orderBy('email'));
        const querySnapshot = await getDocs(usersQuery);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
    } catch (error: any) {
        // Silently fail on permission errors, which can happen if the admin's custom claims
        // haven't propagated yet, or if rules are misconfigured. The dashboard will just show 0 users.
        console.error("Failed to fetch users (silently failing):", error);
        // Do not throw an error. Return an empty array.
        return [];
    }
};

const toggleUserAccount = async (db: Firestore, auth: Auth, uid: string, disabled: boolean) => {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'super_admin') {
            throw new Error('The super admin account cannot be disabled.');
        }
        await updateDoc(userDocRef, { disabled });
        await ActivityLogService.logAdminAction(auth, db, disabled ? 'user_disabled' : 'user_enabled', { targetUid: uid, targetEmail: userDoc.exists() ? userDoc.data().email : 'unknown' });
    } catch(error: any) {
        await LoggerService.logError(db, auth, error, { function: 'toggleUserAccount', targetUid: uid, disabled });
        throw new Error(error.message || 'Failed to update user status.');
    }
};

const deleteUser = async (db: Firestore, auth: Auth, uid: string) => {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'super_admin') {
                throw new Error('The super admin account cannot be deleted.');
            }
            await ActivityLogService.logAdminAction(auth, db, 'user_deleted_firestore', { targetUid: uid, targetEmail: userData.email });
        }
        await deleteDoc(userDocRef);
    } catch (error: any) {
        await LoggerService.logError(db, auth, error, { function: 'deleteUser', targetUid: uid });
        throw new Error(error.message || 'Failed to delete user document from Firestore.');
    }
}

export const AuthService = {
    signIn,
    signOut,
    signUp,
    updateUserRole,
    sendPasswordResetEmailToUser,
    changePassword,
    getUserRole,
    getAllUsers,
    toggleUserAccount,
    deleteUser,
    createUser,
};
