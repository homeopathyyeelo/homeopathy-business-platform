import { useState, useCallback } from 'react';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export function useScheduler() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);

  const fetchScheduledPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/social/scheduler');
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts');
      }
      const data = await response.json();
      setPosts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching scheduled posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const schedulePost = useCallback(async (postData: Omit<ScheduledPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/social/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule post');
      }

      const data = await response.json();
      setPosts(prev => [...prev, data.data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule post');
      console.error('Error scheduling post:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    posts,
    fetchScheduledPosts,
    schedulePost,
  };
}
