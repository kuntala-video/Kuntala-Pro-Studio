'use client';

import { StudioLayout } from '@/components/studio-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  PackageCheck,
  Loader2,
  MoreVertical,
  Download,
  FolderKanban,
  Copy,
  RefreshCw,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExportJob } from '@/lib/types';
import { useExportQueue } from '@/hooks/use-export-queue';
import { formatDistanceToNow } from 'date-fns';

function JobCard({ job, onRetry, onDuplicate }: { job: ExportJob; onRetry: (id: string) => void; onDuplicate: (id: string) => void }) {
  const { toast } = useToast();
  const statusConfig = {
    queued: { color: 'bg-gray-500', icon: <Loader2 className="h-3 w-3" /> }, // Not spinning for queued
    processing: { color: 'bg-blue-500', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    completed: { color: 'bg-green-500', icon: <PackageCheck className="h-3 w-3" /> },
    failed: { color: 'bg-destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  };

  const priorityConfig = {
    low: { color: 'border-green-500/50 text-green-600', icon: <ArrowDown /> },
    normal: { color: 'border-yellow-500/50 text-yellow-600', icon: <ChevronsUpDown /> },
    high: { color: 'border-red-500/50 text-red-600', icon: <ArrowUp /> },
  };

  const handleDownload = () => {
    toast({ title: "Download started (simulation)", description: `Downloading export for ${job.projectName}` });
  };
  
  const openProject = () => {
    toast({ title: "Opening project (simulation)", description: `Navigating to project ID: ${job.projectId}` });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <Badge variant="outline" className={cn("capitalize flex items-center gap-1", priorityConfig[job.priority].color)}>
                {priorityConfig[job.priority].icon}
                {job.priority}
            </Badge>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    {job.status === 'completed' && <DropdownMenuItem onClick={handleDownload}><Download className="mr-2"/> Download</DropdownMenuItem>}
                    {job.status === 'failed' && <DropdownMenuItem onClick={() => onRetry(job.id)}><RefreshCw className="mr-2"/> Retry Export</DropdownMenuItem>}
                    <DropdownMenuItem onClick={() => onDuplicate(job.id)}><Copy className="mr-2"/> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={openProject}><FolderKanban className="mr-2"/> Open Project</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <CardTitle className="truncate">{job.projectName}</CardTitle>
        <CardDescription>Format: {job.format.toUpperCase()} | Resolution: {job.resolution}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
                <div className={cn("h-2.5 w-2.5 rounded-full", statusConfig[job.status].color)}></div>
                <span className="capitalize">{job.status}</span>
            </div>
            {(job.status === 'processing' || job.status === 'completed') && <span>{Math.round(job.progress)}%</span>}
          </div>
          {(job.status === 'processing' || job.status === 'completed') && <Progress value={job.progress} />}
        </div>
        {job.status === 'failed' && job.failureReason && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
                {job.failureReason}
            </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
            {job.status === 'queued' ? `Queued ${formatDistanceToNow(new Date(job.requestTimestamp as any), { addSuffix: true })}` 
            : job.status === 'completed' && job.completionTimestamp ? `Completed ${formatDistanceToNow(new Date(job.completionTimestamp as any), { addSuffix: true })}`
            : `Requested ${formatDistanceToNow(new Date(job.requestTimestamp as any), { addSuffix: true })}`}
        </p>
      </CardFooter>
    </Card>
  );
}

export default function ExportQueuePage() {
    const { jobs, retryJob, duplicateJob, clearQueue, addJob } = useExportQueue();

    // The user prompt doesn't specify how to add jobs, but for a good demo, I'll add a button.
    const handleAddDemoJob = () => {
        const demoProjectNames = [
            'Project Alpha - Feature Film',
            'Project Beta - Short Animation',
            'Project Gamma - VFX Shots',
            'Project Delta - Ad Campaign',
            'Project Epsilon - Music Video',
        ];
        const formats: ExportJob['format'][] = ['video', 'gif', 'frames'];
        const resolutions: ExportJob['resolution'][] = ['720p', '1080p', '4K'];
        const priorities: ExportJob['priority'][] = ['low', 'normal', 'high'];

        addJob({
            projectId: `proj_${Math.random().toString(36).substring(7)}`,
            projectName: demoProjectNames[Math.floor(Math.random() * demoProjectNames.length)],
            format: formats[Math.floor(Math.random() * formats.length)],
            resolution: resolutions[Math.floor(Math.random() * resolutions.length)],
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            requestedByUserId: 'user123', // dummy data
        });
    };

    return (
        <StudioLayout>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <PackageCheck className="text-primary"/> Export Queue
                        </CardTitle>
                        <CardDescription>Monitor the progress of all your project exports.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Button onClick={handleAddDemoJob}>
                            Add Demo Job
                        </Button>
                        <Button variant="destructive" onClick={clearQueue} disabled={jobs.length === 0}>
                           <Trash2 className="mr-2"/> Clear All
                        </Button>
                    </CardContent>
                </Card>

                {jobs.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {jobs.map(job => (
                            <JobCard key={job.id} job={job} onRetry={retryJob} onDuplicate={duplicateJob} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
                        <PackageCheck className="h-16 w-16 mb-4" />
                        <h3 className="text-lg font-semibold">The Export Queue is Empty</h3>
                        <p>Click "Add Demo Job" to see the worker in action.</p>
                    </div>
                )}
            </div>
        </StudioLayout>
    );
}
