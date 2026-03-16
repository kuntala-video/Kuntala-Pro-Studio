'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ExportJob } from '@/lib/types';
import { RenderWorker, type ProgressCallback } from '@/lib/render-worker';
import { useToast } from './use-toast';

const LOCAL_STORAGE_KEY = 'export-queue-jobs';

export function useExportQueue() {
    const { toast } = useToast();
    const [jobs, setJobs] = useState<ExportJob[]>([]);

    // Load from localStorage on mount (client-side only) to prevent hydration errors.
    useEffect(() => {
        try {
            const localData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) {
                setJobs(JSON.parse(localData));
            }
        } catch (error) {
            console.error("Error reading from localStorage", error);
        }
    }, []); // Empty dependency array ensures this runs once on mount.


    // Persist jobs to localStorage whenever they change
    useEffect(() => {
        // We check for window to avoid trying to access localStorage on the server,
        // even though this effect should only run client-side.
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobs));
            } catch (error) {
                console.error("Error writing to localStorage", error);
            }
        }
    }, [jobs]);

    const handleProgress: ProgressCallback = useCallback((jobId, updates) => {
        setJobs(prevJobs =>
            prevJobs.map(j =>
                j.id === jobId ? { ...j, ...updates } : j
            )
        );
    }, []);

    // The main worker loop effect
    useEffect(() => {
        const workerInterval = setInterval(() => {
            if (RenderWorker.isProcessing()) {
                return; // Worker is busy
            }
            
            const queuedJob = jobs.find(j => j.status === 'queued');

            if (queuedJob) {
                RenderWorker.processJob(queuedJob, handleProgress);
            }
        }, 2000); // Check for new jobs every 2 seconds

        return () => clearInterval(workerInterval);
    }, [jobs, handleProgress]);

    const addJob = useCallback((newJobData: Omit<ExportJob, 'id' | 'status' | 'progress' | 'requestTimestamp'>) => {
        const newJob: ExportJob = {
            id: `exp_${Date.now()}`,
            status: 'queued',
            progress: 0,
            requestTimestamp: new Date() as any, // Cast to any to satisfy TS, will be converted by Firestore
            ...newJobData,
        };
        setJobs(prevJobs => [newJob, ...prevJobs]);
        toast({ title: "Job Added to Queue", description: `"${newJob.projectName}" is now queued for export.`});
    }, [toast]);

    const retryJob = useCallback((jobId: string) => {
        setJobs(prevJobs =>
            prevJobs.map(j =>
                j.id === jobId ? { ...j, status: 'queued', progress: 0, failureReason: undefined } : j
            )
        );
        toast({ title: 'Job Re-queued', description: 'The export job will be processed again.' });
    }, [toast]);

    const duplicateJob = useCallback((jobId: string) => {
        const jobToCopy = jobs.find(j => j.id === jobId);
        if (jobToCopy) {
            const newJob: ExportJob = {
                ...jobToCopy,
                id: `exp_${Date.now()}`,
                status: 'queued',
                progress: 0,
                requestTimestamp: new Date() as any,
                completionTimestamp: undefined,
                failureReason: undefined,
            };
            setJobs(prev => [newJob, ...prev]);
            toast({ title: 'Job Duplicated', description: 'A copy of the export job has been created.' });
        }
    }, [jobs, toast]);
    
    const clearQueue = useCallback(() => {
        setJobs([]);
        toast({ title: 'Queue Cleared' });
    }, [toast]);

    return { jobs, addJob, retryJob, duplicateJob, clearQueue };
}
