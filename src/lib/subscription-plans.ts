'use client';
import {
  collection,
  query,
  where,
  getDocs,
  type Firestore,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { SubscriptionPlan } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const createSubscriptionPlan = async (db: Firestore, plan: Omit<SubscriptionPlan, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, "subscriptionPlans"), {
        ...plan,
        createdAt: serverTimestamp(),
    });
};

const getActiveSubscriptionPlans = async (db: Firestore): Promise<SubscriptionPlan[]> => {
    const plansCollectionRef = collection(db, 'subscriptionPlans');
    let querySnapshot;

    try {
        querySnapshot = await getDocs(plansCollectionRef);
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({ path: 'subscriptionPlans', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
        throw new Error('Could not load subscription plans.');
    }

    if (querySnapshot.empty) {
        // If the collection is empty, seed it with default plans.
        // This is useful for first-time setup.
        const defaultPlans: Omit<SubscriptionPlan, 'id' | 'createdAt'>[] = [
            { name: 'monthly', durationInMonths: 1, price: 200, currency: 'INR', isActive: true },
            { name: 'quarterly', durationInMonths: 3, price: 1200, currency: 'INR', isActive: true },
            { name: 'yearly', durationInMonths: 12, price: 2000, currency: 'INR', isActive: true },
        ];
        
        try {
            for (const plan of defaultPlans) {
                await createSubscriptionPlan(db, plan);
            }
            // Refetch after seeding
            querySnapshot = await getDocs(plansCollectionRef);
        } catch (error) {
            console.error("Failed to seed subscription plans:", error);
            return []; // If seeding fails, return empty to avoid breaking the UI
        }
    }

    const allPlans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubscriptionPlan[];
    return allPlans.filter(plan => plan.isActive);
};


export const SubscriptionPlanService = {
    getActiveSubscriptionPlans,
    createSubscriptionPlan,
};
