'use client';

// This file serves as a barrel file for easy access to Firebase-related hooks and providers.
// The actual initialization is now handled in @/lib/firebase.ts to ensure a single instance.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
