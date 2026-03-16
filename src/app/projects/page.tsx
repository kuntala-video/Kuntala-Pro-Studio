'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { ProjectService } from '@/lib/projects';
import { db, auth } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { downloadJson, cn } from '@/lib/utils';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Plus, MoreHorizontal, Trash2, Download, Search, ArrowUpDown, FolderKanban, History } from 'lucide-react';
import { useProject } from '@/context/project-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal and form states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('updatedAt-desc');
  
  const { refreshProjects } = useProject();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);

    if (!auth || !db) {
        toast({ title: 'Firebase not initialized', description: 'Please wait a moment and refresh.', variant: 'destructive'});
        setProjects([]);
        setIsLoading(false);
        return;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
        setProjects([]);
        setIsLoading(false);
        return;
    }

    try {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const isAdmin = profileDoc.exists() && ['admin', 'super_admin'].includes(profileDoc.data().role);

        let projectsQuery;
        if (isAdmin) {
             projectsQuery = query(collection(db, 'projects'));
        } else {
             projectsQuery = query(collection(db, 'projects'), where('ownerId', '==', currentUser.uid));
        }

        const querySnapshot = await getDocs(projectsQuery);
        const userProjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
        setProjects(userProjects);
        
    } catch (err) {
        console.error("Project load error:", err);
        toast({ title: "Failed to load projects", description: (err as Error).message, variant: "destructive" });
        setProjects([]);
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (isUserLoading) {
        return;
    }
    
    loadProjects();

  }, [isUserLoading, user, loadProjects]);

  const handleOpenModal = () => {
    setCurrentProject(null);
    setNewProjectTitle('');
    setIsProjectModalOpen(true);
  };

  const handleOpenDeleteAlert = (project: Project) => {
    setCurrentProject(project);
    setIsDeleteAlertOpen(true);
  };
  
  const handleExportProject = (project: Project) => {
    if (!project) return;
    const filename = `${project.title.replace(/\s+/g, '-')}.json`;
    downloadJson(project, filename);
    toast({ title: "Project Exported", description: `Downloaded ${filename}` });
  };


  const handleProjectSubmit = useCallback(async () => {
    if (!user) return toast({ title: 'Not Authenticated', variant: 'destructive' });
    if (!newProjectTitle.trim()) return toast({ title: 'Title is required', variant: 'destructive' });

    setIsSubmitting(true);
    try {
      await ProjectService.createProject(auth, { ownerId: user.uid, title: newProjectTitle });
      toast({ title: 'Project Created', description: `"${newProjectTitle}" has been created.` });
      setIsProjectModalOpen(false);
      setNewProjectTitle('');
      await loadProjects();
      refreshProjects();
    } catch (error: any) {
      toast({ title: 'An error occurred', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, auth, newProjectTitle, toast, loadProjects, refreshProjects]);


  const handleDeleteConfirm = useCallback(async () => {
    if (!currentProject) return;

    setIsSubmitting(true);
    try {
      await ProjectService.deleteProject(auth, currentProject.id);
      toast({ title: 'Project Deleted', description: `"${currentProject.title}" has been deleted.` });
      setIsDeleteAlertOpen(false);
      setCurrentProject(null);
      await loadProjects();
      refreshProjects();
    } catch (error: any) {
      toast({ title: 'Error deleting project', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentProject, auth, toast, loadProjects, refreshProjects]);
  
  const sortedAndFilteredProjects = useMemo(() => {
    return projects
      .filter(p => p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const [key, direction] = sortOrder.split('-');
        let valA = a[key as keyof Project];
        let valB = b[key as keyof Project];
        
        if (valA?.toDate && typeof valA.toDate === 'function') valA = valA.toDate();
        if (valB?.toDate && typeof valB.toDate === 'function') valB = valB.toDate();

        if (!valA || !valB) return 0;
        
        let comparison = 0;
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;

        return direction === 'desc' ? comparison * -1 : comparison;
      });
  }, [projects, searchTerm, sortOrder]);


  return (
    <StudioLayout>
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold font-headline">Projects</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search projects..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="shrink-0">
                                <ArrowUpDown className="mr-2" /> Sort by
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSortOrder('updatedAt-desc')}>Last Modified</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('createdAt-desc')}>Date Created</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('title-asc')}>Title (A-Z)</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={handleOpenModal} disabled={isSubmitting}>
                        <Plus className="mr-2" /> New Project
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-4 w-1/2"/>
                                <Skeleton className="h-4 w-full"/>
                            </CardContent>
                            <CardFooter><Skeleton className="h-10 w-full"/></CardFooter>
                        </Card>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <Card className="text-center py-16">
                    <CardHeader>
                        <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit mb-4">
                            <FolderKanban className="h-12 w-12 text-muted-foreground"/>
                        </div>
                        <CardTitle>No projects yet</CardTitle>
                        <CardDescription>Create your first project to get started.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleOpenModal}>Create Project</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedAndFilteredProjects.map((project) => (
                        <Card key={project.id} className="flex flex-col hover:border-primary/50 transition-all">
                            <CardHeader className="flex-row items-start justify-between">
                                <CardTitle className="font-headline text-lg">{project.title}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 -mt-2 -mr-2" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExportProject(project); }}>
                                            <Download className="mr-2"/> Export
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDeleteAlert(project); }} className="text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2"/> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Last Edited</Label>
                                    <p className="text-sm">{project.updatedAt?.toDate ? formatDistanceToNow(project.updatedAt.toDate(), { addSuffix: true }) : 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Progress</Label>
                                    <Progress value={Math.floor(Math.random() * 80) + 10} className="h-2 mt-1"/>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="secondary" onClick={() => router.push(`/animation-studio?projectId=${project.id}`)}>Open</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><History/> Recent Activity</CardTitle>
                    <CardDescription>A log of recent changes across all your projects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">Recent activity will be shown here.</p>
                </CardContent>
            </Card>

        </div>

      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Give your new project a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-title" className="text-right">
                Title
              </Label>
              <Input
                id="project-title"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
                onKeyDown={(e) => e.key === 'Enter' && handleProjectSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleProjectSubmit} disabled={isSubmitting || !newProjectTitle.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <span className="font-bold"> "{currentProject?.title}" </span>
              and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudioLayout>
  );
}
