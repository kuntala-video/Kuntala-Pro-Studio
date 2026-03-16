'use client';
import { type Firestore, type Auth, doc, updateDoc, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore';
import type { PaymentRequest, UserProfile } from './types';
import { AuthService } from './auth';
import { ActivityLogService } from './activity-log';

// Simulates checking a transaction ID with a payment gateway
const simulateVerification = async (transactionId: string): Promise<{ success: boolean; reason?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    
    // In a real app, you'd make an API call here.
    // For simulation, let's say some transaction IDs are invalid.
    if (transactionId.toLowerCase().includes('fail')) {
        return { success: false, reason: 'Transaction ID not found in gateway.' };
    }
    if (transactionId.length < 5) {
        return { success: false, reason: 'Invalid transaction ID format.' };
    }

    // 90% success rate for others
    if (Math.random() < 0.1) {
        return { success: false, reason: 'Gateway communication error.' };
    }

    return { success: true };
}

/**
 * Verifies a payment, and if successful, creates or updates a user account.
 */
const verifyPaymentAndProvisionUser = async (db: Firestore, auth: Auth, request: PaymentRequest): Promise<string> => {
    const adminUser = auth.currentUser;
    if (!adminUser) throw new Error("Admin authentication required.");

    // 1. Simulate Payment Verification
    const verification = await simulateVerification(request.transactionId);

    if (!verification.success) {
        await updateDoc(doc(db, 'paymentRequests', request.id), {
            status: 'failed',
            verificationFailureReason: verification.reason || 'Unknown verification error.',
            updatedAt: serverTimestamp(),
        });
        throw new Error(`Verification failed: ${verification.reason}`);
    }

    // 2. Verification successful, find or create user
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", request.email));
    const querySnapshot = await getDocs(q);
    
    let targetUser: UserProfile | null = null;
    let userId: string;

    if (!querySnapshot.empty) {
        // User exists
        const userDoc = querySnapshot.docs[0];
        userId = userDoc.id;
        targetUser = { id: userId, ...userDoc.data() } as UserProfile;
    } else {
        // User does not exist, create them
        const year = new Date().getFullYear();
        const guestNumber = Math.floor(1 + Math.random() * 999).toString().padStart(3, '0');
        const newGuestName = `guest_${year}_${guestNumber}`;
        const newPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;

        const { user: newAuthUser } = await AuthService.createUser(auth, db, {
            email: request.email,
            password: newPassword,
            displayName: newGuestName,
            role: 'subscriber',
            plan: request.plan as UserProfile['plan'],
            phone: request.whatsapp,
        });
        userId = newAuthUser.uid;
        // The user profile is created inside AuthService.createUser, so we don't need to do it here.
    }
    
    // 3. Update User's plan and credits (for both new and existing users)
    const plan = request.plan as UserProfile['plan'];
    const planCreditsMap = { 'monthly': 1000, 'quarterly': 3500, 'yearly': 8000, 'enterprise': 20000, 'free': 100 };
    const creditsToAdd = planCreditsMap[plan] || 0;
    
    const now = new Date();
    let subscriptionEndDate: Date | undefined = undefined;
    if (plan === 'monthly') subscriptionEndDate = new Date(new Date().setDate(now.getDate() + 30));
    if (plan === 'quarterly') subscriptionEndDate = new Date(new Date().setDate(now.getDate() + 90));
    if (plan === 'yearly' || plan === 'enterprise') subscriptionEndDate = new Date(now.setFullYear(now.getFullYear() + 1));

    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
        plan: plan,
        'wallet.credits': (targetUser?.wallet?.credits || 0) + creditsToAdd,
        subscriptionEnd: subscriptionEndDate,
        updatedAt: serverTimestamp(),
    });

    // 4. Update the payment request to link it and mark as verified
    await updateDoc(doc(db, 'paymentRequests', request.id), {
        status: 'verified',
        userId: userId, // Link to the provisioned user
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    await ActivityLogService.logAdminAction(auth, db, 'payment_auto_verified', {
        paymentRequestId: request.id,
        userEmail: request.email,
        userId: userId,
        plan: plan,
        amount: request.amount,
    });

    return `User ${request.email} provisioned successfully with the ${plan} plan.`;
};


export const PaymentAutomationService = {
    verifyPaymentAndProvisionUser,
};
