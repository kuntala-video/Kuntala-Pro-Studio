'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, type DocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Direct import of singleton instances
import type { UserProfile, UserPermissions } from '@/lib/types';
import { ActivityLogService } from '@/lib/activity-log';
import { LoggerService } from '@/lib/logger';
import { useToast } from './use-toast';

interface UserContextType {
    user: User | null;
    userProfile: UserProfile | null;
    isLoading: boolean;
    refreshUserProfile: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserProfile = useCallback(async (userToFetch: User): Promise<UserProfile | null> => {
        if (!db || !auth) return null;

        const userProfileRef = doc(db, 'users', userToFetch.uid);
        
        try {
            const getDocPromise = getDoc(userProfileRef);
            // Increased timeout to 2 seconds for more reliability on slow networks
            const timeoutPromise = new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 2000)); 
            const raceResult = await Promise.race([getDocPromise, timeoutPromise]);

            if (raceResult === 'timeout') {
                console.error("User profile fetch timed out. Using fallback.");
                await LoggerService.logError(db, auth, new Error("Profile fetch timeout"), { function: 'fetchUserProfile', userId: userToFetch.uid });
            } else {
                 const userProfileSnap = raceResult as DocumentSnapshot<DocumentData>;
                 if (userProfileSnap.exists()) {
                    return { id: userProfileSnap.id, ...userProfileSnap.data() } as UserProfile;
                } else if (!userToFetch.isAnonymous) {
                    // Profile does not exist, create it.
                    let role: UserProfile['role'] = 'subscriber';
                    if (userToFetch.email === 'kuntalavideo@gmail.com') {
                        role = 'super_admin';
                    }
                    
                    const isPrivileged = role === 'staff' || role === 'admin' || role === 'super_admin';
                    const plan = role === 'subscriber' ? 'free' : 'enterprise';
                    
                    const permissions: UserPermissions = {
                        animation: true,
                        reels: true,
                        voiceClone: isPrivileged || plan === 'quarterly' || plan === 'yearly' || plan === 'enterprise',
                        avatar: isPrivileged || plan === 'yearly' || plan === 'enterprise',
                        cinematic: isPrivileged || plan === 'enterprise',
                    };
                    
                    const newProfileData: Omit<UserProfile, 'id'> = {
                        uid: userToFetch.uid,
                        email: userToFetch.email || '',
                        role: role,
                        plan: plan,
                        permissions: permissions,
                        wallet: { credits: role === 'subscriber' ? 100 : 10000, spent: 0 },
                        createdAt: serverTimestamp() as any,
                        updatedAt: serverTimestamp() as any,
                        disabled: false,
                        createdBy: role === 'super_admin' ? 'system' : 'self',
                        ...(role === 'super_admin' && { phone: '123-456-7890' }),
                    };

                    await setDoc(userProfileRef, newProfileData);
                    if (role === 'super_admin') {
                        ActivityLogService.logAdminAction(auth, db, 'super_admin_profile_created', { createdUserEmail: userToFetch.email! });
                    }

                    const newSnap = await getDoc(userProfileRef);
                    if (newSnap.exists()) {
                        return { id: newSnap.id, ...newSnap.data() } as UserProfile;
                    }
                } else {
                    // Anonymous user with no profile, which is expected.
                    return null;
                }
            }
        } catch (error: any) {
            console.error("Firestore error fetching/creating user profile. Using fallback:", error);
            await LoggerService.logError(db, auth, error, { function: 'fetchUserProfile', userId: userToFetch.uid });
        }

        // Fallback logic for timeout or other errors. Ensures the app doesn't get stuck.
        const isSuperAdminEmail = userToFetch.email === 'kuntalavideo@gmail.com';
        const fallbackProfile: UserProfile = {
            id: userToFetch.uid,
            uid: userToFetch.uid,
            email: userToFetch.email || 'unknown@example.com',
            displayName: isSuperAdminEmail ? "Super Admin" : "Studio User",
            role: isSuperAdminEmail ? 'super_admin' : 'subscriber',
            plan: isSuperAdminEmail ? 'enterprise' : 'free',
            disabled: false,
            permissions: {
                animation: true,
                reels: true,
                voiceClone: isSuperAdminEmail,
                avatar: isSuperAdminEmail,
                cinematic: isSuperAdminEmail,
            },
            wallet: { credits: 0, spent: 0 },
        };
        return fallbackProfile;
    }, [auth, db]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    setAuthUser(firebaseUser);
                    const profile = await fetchUserProfile(firebaseUser);
                    setUserProfile(profile);
                } else {
                    setAuthUser(null);
                    setUserProfile(null);
                }
            } catch (error) {
                console.error("Error during auth state change processing:", error);
                setAuthUser(null);
                setUserProfile(null);
            } finally {
                setIsLoading(false);
            }
        }, (error) => {
            console.error("Auth state listener error:", error);
            LoggerService.logError(db, auth, error, { function: 'onAuthStateChanged' });
            setAuthUser(null);
            setUserProfile(null);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [fetchUserProfile, auth, db]);
    
    const refreshUserProfile = useCallback(async () => {
        if (authUser) {
            setIsLoading(true);
            const profile = await fetchUserProfile(authUser);
            setUserProfile(profile);
            setIsLoading(false);
        }
    }, [authUser, fetchUserProfile]);
    
    return (
        <UserContext.Provider value={{ user: authUser, userProfile, isLoading, refreshUserProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
