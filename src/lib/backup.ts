'use client';

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';
import { type Auth } from 'firebase/auth';
import { LoggerService } from './logger';
import { ProjectService } from './projects';
import type { Project } from './types';

function downloadJson(data: any, filename: string) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getTimestampedFilename(base: string) {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${base}-backup-${timestamp}.json`;
}


/**
 * Fetches all projects for a given user and downloads them as a JSON file.
 */
async function exportUserProjects(db: Firestore, userId: string) {
  try {
    const projectsQuery = query(collection(db, 'projects'), where('ownerId', '==', userId));
    const querySnapshot = await getDocs(projectsQuery);
    const projects = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // We don't need to export ownerId as it's implicit on import
      const { ownerId, ...projectData } = data;
      return { id: doc.id, ...projectData };
    });
    
    downloadJson(projects, getTimestampedFilename('kuntala-projects'));
  } catch (error: any) {
    // No auth object here, so we pass null and let the logger handle it
    await LoggerService.logError(db, null as any, error, { function: 'exportUserProjects', userId });
    throw new Error('Could not fetch projects for export.');
  }
};


/**
 * Imports an array of projects from a JSON file for a specific user.
 */
async function importProjectsFromJson(db: Firestore, auth: Auth, userId: string, projects: Project[]) {
  try {
    // Use Promise.all to run all project creation operations in parallel
    const importPromises = projects.map(project => {
        // Pass the full project data to be created, including scenes.
        return ProjectService.createProject(db, auth, {
            ownerId: userId,
            title: project.title,
            scenes: project.scenes,
        });
    });

    await Promise.all(importPromises);

  } catch (error: any) {
     await LoggerService.logError(db, auth, error, { function: 'importProjectsFromJson', userId });
     throw new Error('An error occurred during the import process.');
  }
};


/**
 * Fetches all documents from a given collection.
 */
const exportCollection = async (db: Firestore, collectionName: string): Promise<DocumentData[]> => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


/**
 * Fetches data from all major collections for a full client-side backup.
 * This is an admin-only function.
 */
async function exportAllData(db: Firestore) {
    try {
        const collectionsToExport = ['users', 'projects', 'accessRequests', 'activityLogs', 'systemLogs', 'supportTickets'];
        
        const backupData: Record<string, DocumentData[]> = {};

        for (const collectionName of collectionsToExport) {
            backupData[collectionName] = await exportCollection(db, collectionName);
        }

        downloadJson(backupData, getTimestampedFilename('kuntala-full'));

    } catch (error: any) {
        await LoggerService.logError(db, null as any, error, { function: 'exportAllData' });
        throw new Error('Could not complete the full data export.');
    }
};


export const BackupService = {
  exportUserProjects,
  importProjectsFromJson,
  exportAllData,
};
