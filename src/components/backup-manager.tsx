'use client';

import { useState, useRef } from 'react';
import { useUser } from '@/hooks/use-user';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Loader2, Download, Upload, ShieldCheck, DatabaseBackup } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BackupService } from '@/lib/backup';
import type { Project } from '@/lib/types';
import { Separator } from './ui/separator';

export function BackupManager() {
  const { user, userProfile } = useUser();
  const { db, auth } = useFirebase();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAdminExporting, setIsAdminExporting] = useState(false);
  
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [projectsToImport, setProjectsToImport] = useState<Project[]>([]);


  const handleExportProjects = async () => {
    if (!user || !db) return;
    setIsExporting(true);
    try {
      await BackupService.exportUserProjects(db, user.uid);
      toast({ title: 'Export Successful', description: 'Your projects have been downloaded as a JSON file.' });
    } catch (error: any) {
      toast({ title: 'Export Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdminExport = async () => {
    if (!db) return;
    setIsAdminExporting(true);
    try {
      await BackupService.exportAllData(db);
      toast({ title: 'Full Export Successful', description: 'A full backup of all major collections has been downloaded.' });
    } catch (error: any) {
       toast({ title: 'Full Export Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsAdminExporting(false);
    }
  }
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (Array.isArray(data) && data.length > 0) {
          // Basic validation: check if the first item looks like a project
          if ('title' in data[0] && 'scenes' in data[0]) {
             setProjectsToImport(data);
             setIsImportAlertOpen(true);
          } else {
            throw new Error("JSON file does not appear to contain project data.");
          }
        } else {
            throw new Error("JSON file is empty or not an array.");
        }
      } catch (error: any) {
        toast({ title: 'Invalid File', description: `Could not read projects from file: ${error.message}`, variant: 'destructive' });
      }
    };
    reader.onerror = () => {
        toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    }
    reader.readAsText(file);
    // Reset file input so user can select the same file again if needed
    event.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!user || projectsToImport.length === 0 || !db || !auth) return;
    setIsImporting(true);
    setIsImportAlertOpen(false);

    try {
      await BackupService.importProjectsFromJson(db, auth, user.uid, projectsToImport);
      toast({
        title: 'Import Successful',
        description: `${projectsToImport.length} project(s) have been imported.`,
      });
    } catch (error: any) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
      setProjectsToImport([]);
    }
  };
  
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <DatabaseBackup className="text-primary" /> Settings & Data Management
          </CardTitle>
          <CardDescription>Manage your application settings and user data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Project Backups</h3>
            <p className="text-sm text-muted-foreground mb-4">Export your projects to a local file, or import them from a backup.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExportProjects} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2" />}
                Export My Projects
              </Button>
               <Input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelected}
                accept="application/json"
                disabled={isImporting}
                />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2" />}
                Import Projects
              </Button>
            </div>
          </div>
        
          {isAdmin && (
            <>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2"><ShieldCheck/> Admin Tools</h3>
                    <p className="text-sm text-muted-foreground mb-4">Perform a full backup of all critical application data.</p>
                    <Button variant="destructive" onClick={handleAdminExport} disabled={isAdminExporting}>
                        {isAdminExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2" />}
                        Export Full Backup (Admin)
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Includes users, projects, access requests, activity logs, system logs, and support tickets. This is a client-side backup. For a complete disaster recovery solution, use the gcloud CLI or GCP Console for scheduled Firestore exports.</p>
                </div>
            </>
          )}

        </CardContent>
      </Card>
      
      {/* Import Confirmation Dialog */}
       <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Project Import</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to import <span className="font-bold">{projectsToImport.length}</span> project(s)? 
              This will add them to your existing projects. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectsToImport([])}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Yes, Import Projects
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
