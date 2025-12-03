"use client";

import { useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { useJobStatus, BackgroundJob } from '@/hooks/useJobStatus';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface JobStatusToastProps {
  jobId: string;
  jobType: string;
  onComplete?: (job: BackgroundJob) => void;
  onError?: (error: string) => void;
}

export function JobStatusToast({ jobId, jobType, onComplete, onError }: JobStatusToastProps) {
  const { job, isComplete, isFailed, isRunning, progress } = useJobStatus({
    jobId,
    onComplete: (completedJob) => {
      toast.success(`${getJobTypeName(jobType)} completed!`, {
        description: getCompletionMessage(completedJob),
        duration: 5000,
      });
      onComplete?.(completedJob);
    },
    onError: (error) => {
      toast.error(`${getJobTypeName(jobType)} failed`, {
        description: error,
        duration: 10000,
      });
      onError?.(error);
    },
    pollInterval: 2000,
    stopOnComplete: true,
  });

  useEffect(() => {
    if (isRunning && job) {
      const toastId = `job-${jobId}`;
      
      toast.loading(
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between">
            <span className="font-medium">{getJobTypeName(jobType)}</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-muted-foreground">{getStatusMessage(job)}</span>
        </div>,
        {
          id: toastId,
          duration: Infinity,
        }
      );
    }
  }, [jobId, jobType, isRunning, progress, job]);

  return null;
}

function getJobTypeName(jobType: string): string {
  const names: Record<string, string> = {
    backup_create: 'Database Backup',
    backup_restore: 'Database Restore',
    data_import: 'Data Import',
    report_generate: 'Report Generation',
    email_send: 'Email Send',
    bulk_update: 'Bulk Update',
  };
  return names[jobType] || 'Background Job';
}

function getStatusMessage(job: BackgroundJob): string {
  switch (job.status) {
    case 'pending':
      return 'Queued and waiting to start...';
    case 'running':
      return `Processing... (${job.progress}/${job.total})`;
    case 'completed':
      return 'Completed successfully!';
    case 'failed':
      return job.error_message || 'Job failed';
    case 'cancelled':
      return 'Job was cancelled';
    default:
      return 'Unknown status';
  }
}

function getCompletionMessage(job: BackgroundJob): string {
  if (job.result) {
    try {
      const result = typeof job.result === 'string' ? JSON.parse(job.result) : job.result;
      
      if (job.job_type === 'backup_create') {
        const sizeInMB = result.size ? (result.size / (1024 * 1024)).toFixed(2) : 'unknown';
        return `Backup created: ${result.filename || 'backup file'} (${sizeInMB} MB)`;
      }
      
      if (job.job_type === 'data_import') {
        return `Imported ${result.total || 0} records successfully`;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return 'Job completed successfully';
}

// Helper component for manual job status display
export function JobStatusBadge({ status }: { status: BackgroundJob['status'] }) {
  const config = {
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    running: {
      icon: Loader2,
      label: 'Running',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse',
    },
    completed: {
      icon: CheckCircle2,
      label: 'Completed',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    cancelled: {
      icon: XCircle,
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
