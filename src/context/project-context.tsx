'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { Project } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { ProjectService } from '@/lib/projects';
import { auth, db } from '@/lib/firebase';

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  isLoading: boolean;
  refreshProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, isLoading: isUserLoading } = useUser();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, _setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchProjects = useCallback(async () => {
    // For anonymous users, or if there's no user at all, there are no projects to fetch.
    if (!user || user.isAnonymous) {
        setProjects([]);
        _setSelectedProjectId(null);
        setIsLoading(false);
        return;
    };
    // If we have a user but no profile yet, wait for it.
    if (!userProfile) {
        setIsLoading(true);
        return;
    }

    setIsLoading(true);

    try {
        let userProjects: Project[] = [];
        const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';
        
        if (isAdmin) {
            userProjects = await ProjectService.getAllProjectsForAdmin(auth);
        } else {
            userProjects = await ProjectService.getProjects(auth);
        }

        setProjects(userProjects as Project[]);
        
        const projectIdFromUrl = searchParams.get('projectId');
        
        if (projectIdFromUrl && userProjects.some(p => p.id === projectIdFromUrl)) {
            _setSelectedProjectId(projectIdFromUrl);
        } else if (userProjects.length > 0) {
            // Default to the first project if no valid ID is in the URL
            const firstProjectId = userProjects.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0].id;
             _setSelectedProjectId(firstProjectId);
        } else {
            _setSelectedProjectId(null);
        }

    } catch (error: any) {
        // Silently fail on project fetch. This prevents error toasts on pages 
        // that don't need project data, like /request-access.
        console.error("Project context failed to load projects:", error.message);
        setProjects([]);
    } finally {
        setIsLoading(false);
    }
  }, [user, userProfile, searchParams]);

  useEffect(() => {
    // Only fetch projects when the user context is no longer loading
    if(!isUserLoading) {
      fetchProjects();
    }
  }, [isUserLoading, fetchProjects]);


  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const handleSetSelectedProjectId = (id: string | null) => {
    _setSelectedProjectId(id);
    const currentPath = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (id) {
        params.set('projectId', id);
    } else {
        params.delete('projectId');
    }
    router.replace(`${currentPath}?${params.toString()}`, { scroll: false });
  };

  const value: ProjectContextType = {
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId: handleSetSelectedProjectId,
    isLoading: isUserLoading || isLoading, // The context is loading if either user or projects are loading
    refreshProjects: fetchProjects,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
