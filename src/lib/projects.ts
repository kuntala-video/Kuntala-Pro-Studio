'use client';

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { type Auth } from 'firebase/auth';
import { LoggerService } from './logger';
import type { Project, Scene, Character } from './types';
import { db } from './firebase'; // Import the db instance

const createProject = async (
  auth: Auth,
  projectData: { ownerId: string; title: string; scenes?: Scene[], characters?: Character[] }
) => {
  const { ownerId, title, scenes = [], characters = [] } = projectData;
  if (!ownerId || !title) {
    throw new Error('Owner ID and title are required to create a project.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated.');
  }
  try {
    const projectsCollection = collection(db, 'projects');
    const dataToSave = {
      ownerId,
      ownerEmail: user.email || 'N/A',
      title,
      scenes,
      characters,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
    };
    const newDoc = await addDoc(projectsCollection, dataToSave);
    return { id: newDoc.id, ...dataToSave };
  } catch (error: any) {
    await LoggerService.logError(db, auth, error, {
      function: 'createProject',
      ownerId,
    });
    throw new Error('Failed to create project.');
  }
};

const getProjects = async (auth: Auth) => {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }
  try {
    const ownedProjectsQuery = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid)
    );
    const memberProjectsQuery = query(
        collection(db, 'projects'),
        where('members', 'array-contains', user.uid)
    );

    const [ownedSnapshot, memberSnapshot] = await Promise.all([
        getDocs(ownedProjectsQuery),
        getDocs(memberProjectsQuery)
    ]);
    
    const projectsMap = new Map<string, Project>();

    ownedSnapshot.docs.forEach(doc => {
        projectsMap.set(doc.id, { id: doc.id, ...doc.data() } as Project);
    });
    
    memberSnapshot.docs.forEach(doc => {
        projectsMap.set(doc.id, { id: doc.id, ...doc.data() } as Project);
    });

    return Array.from(projectsMap.values());
    
  } catch (error: any) {
    await LoggerService.logError(db, auth, error, {
      function: 'getProjects',
      userId: user.uid,
    });
    throw new Error('Failed to fetch projects.');
  }
};

const getAllProjectsForAdmin = async (auth: Auth): Promise<Project[]> => {
    const user = auth.currentUser;
    // Optional: Add a check to ensure the user is an admin before proceeding.
    // However, Firestore rules should be the primary security measure.
    try {
        const projectsQuery = query(collection(db, 'projects'));
        const querySnapshot = await getDocs(projectsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Project[];
    } catch (error: any) {
        // Silently fail on permission errors. Dashboard will show 0 projects.
        // This is preferable to a red toast that blocks the UI.
        await LoggerService.logError(db, auth, error, {
            function: 'getAllProjectsForAdmin',
            adminId: user?.uid,
        });
        // Do not throw an error. Return an empty array.
        return [];
    }
};

const deleteProject = async (auth: Auth, projectId: string) => {
  if (!projectId) {
    throw new Error('Project ID is required to delete a project.');
  }
  try {
    const projectDocRef = doc(db, 'projects', projectId);
    await deleteDoc(projectDocRef);
    return true;
  } catch (error: any) {
    await LoggerService.logError(db, auth, error, {
      function: 'deleteProject',
      projectId,
    });
    throw new Error('Failed to delete project.');
  }
};

const updateProject = async (auth: Auth, projectId: string, data: Partial<Project>) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User is not authenticated.');
    }
    if (!projectId) {
        throw new Error('Project ID is required to update a project.');
    }
    try {
        const projectDocRef = doc(db, 'projects', projectId);
        await updateDoc(projectDocRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error: any) {
        await LoggerService.logError(db, auth, error, {
            function: 'updateProject',
            projectId,
        });
        throw new Error('Failed to update project.');
    }
};

export const ProjectService = {
  createProject,
  getProjects,
  deleteProject,
  updateProject,
  getAllProjectsForAdmin,
};
