'use client';

import { doc, getDoc, setDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { LoggerService } from './logger';
import type { QrSetting } from './types';

// The settings are stored in a single document with a known ID.
const SETTINGS_DOC_ID = 'default_qr';

const getActiveQrSettings = async (db: Firestore): Promise<QrSetting | null> => {
    try {
        const settingsDocRef = doc(db, 'qr_settings', SETTINGS_DOC_ID);
        let docSnap = await getDoc(settingsDocRef);

        if (!docSnap.exists()) {
            // Seed the document if it doesn't exist
            const defaultSettings: Omit<QrSetting, 'id' | 'updatedAt'> = {
                qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=upi://pay?pa=kuntala-videography@jio&pn=Ranajit%20Maity',
                active: true,
            };
            await setDoc(settingsDocRef, { ...defaultSettings, updatedAt: serverTimestamp() });
            docSnap = await getDoc(settingsDocRef); // Refetch the document
        }

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Explicitly construct the object to ensure type correctness
            return {
                id: docSnap.id,
                qrImage: data.qrImage,
                active: data.active,
                updatedAt: data.updatedAt,
            } as QrSetting;
        }

        return null;
    } catch (error: any) {
        console.error("Failed to fetch or seed QR settings:", error);
        await LoggerService.logError(db, null as any, error, { function: 'getActiveQrSettings' });
        return null;
    }
};

export const QrSettingsService = {
    getActiveQrSettings,
};
