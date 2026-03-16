'use client';

import type { ExportJob } from './types';

// This is a singleton to prevent multiple processing loops
// if the hook is used in multiple places.
let isProcessing = false;
let currentlyProcessingJobId: string | null = null;

export type ProgressCallback = (jobId: string, updates: Partial<ExportJob>) => void;

/**
 * Simulates processing a single export job.
 * @param job The job to process.
 * @param onProgress The callback function to report progress.
 */
async function processJob(job: ExportJob, onProgress: ProgressCallback): Promise<void> {
    if (isProcessing && currentlyProcessingJobId === job.id) {
        console.warn(`[RenderWorker] Job ${job.id} is already being processed.`);
        return;
    }
    
    isProcessing = true;
    currentlyProcessingJobId = job.id;
    console.log(`[RenderWorker] Starting job: ${job.id}`);
    onProgress(job.id, { status: 'processing', progress: 0 });

    const steps = [25, 50, 75, 100];
    for (const progress of steps) {
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        // Simulate a failure
        if (progress > 50 && Math.random() < 0.15) { // 15% chance of failure after 50%
            console.error(`[RenderWorker] Job failed: ${job.id}`);
            onProgress(job.id, { status: 'failed', progress: progress, failureReason: 'Random processing error occurred.' });
            isProcessing = false;
            currentlyProcessingJobId = null;
            return;
        }

        onProgress(job.id, { progress });
        console.log(`[RenderWorker] Job ${job.id} progress: ${progress}%`);
    }

    onProgress(job.id, { status: 'completed', progress: 100, completionTimestamp: new Date() as any });
    console.log(`[RenderWorker] Job completed: ${job.id}`);
    isProcessing = false;
    currentlyProcessingJobId = null;
}

export const RenderWorker = {
  processJob,
  isProcessing: () => isProcessing,
};
