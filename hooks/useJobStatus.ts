import { useState, useEffect, useCallback } from 'react';
import { golangAPI } from '@/lib/api';

export interface BackgroundJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total: number;
  result?: any;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface UseJobStatusOptions {
  jobId: string | null;
  onComplete?: (job: BackgroundJob) => void;
  onError?: (error: string) => void;
  pollInterval?: number; // milliseconds
  stopOnComplete?: boolean;
}

export function useJobStatus({
  jobId,
  onComplete,
  onError,
  pollInterval = 2000,
  stopOnComplete = true,
}: UseJobStatusOptions) {
  const [job, setJob] = useState<BackgroundJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await golangAPI.get(`/api/erp/jobs/${jobId}/status`);
      
      if (response.data.success) {
        const jobData: BackgroundJob = {
          id: response.data.id,
          job_type: response.data.job_type || 'unknown',
          status: response.data.status,
          progress: response.data.progress || 0,
          total: response.data.total || 100,
          result: response.data.result,
          error_message: response.data.error,
          started_at: response.data.started_at,
          completed_at: response.data.completed_at,
          created_at: response.data.created_at || new Date().toISOString(),
          updated_at: response.data.updated_at || new Date().toISOString(),
        };

        setJob(jobData);

        // Handle completion
        if (jobData.status === 'completed') {
          onComplete?.(jobData);
        }

        // Handle failure
        if (jobData.status === 'failed') {
          const errorMsg = jobData.error_message || 'Job failed';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch job status';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [jobId, onComplete, onError]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      return;
    }

    setLoading(true);
    fetchJobStatus();

    // Set up polling
    const interval = setInterval(() => {
      if (job && stopOnComplete && (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled')) {
        clearInterval(interval);
        setLoading(false);
        return;
      }

      fetchJobStatus();
    }, pollInterval);

    return () => {
      clearInterval(interval);
      setLoading(false);
    };
  }, [jobId, job, pollInterval, stopOnComplete, fetchJobStatus]);

  const refresh = useCallback(() => {
    fetchJobStatus();
  }, [fetchJobStatus]);

  return {
    job,
    loading,
    error,
    refresh,
    isComplete: job?.status === 'completed',
    isFailed: job?.status === 'failed',
    isRunning: job?.status === 'running' || job?.status === 'pending',
    progress: job ? Math.round((job.progress / job.total) * 100) : 0,
  };
}
