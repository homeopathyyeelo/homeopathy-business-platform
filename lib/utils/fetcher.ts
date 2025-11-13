import { authFetch } from './auth-broadcast';

/**
 * JSON fetcher for SWR with automatic auth handling
 */
export async function jsonFetcher(url: string) {
  const response = await authFetch(url);
  
  if (!response.ok) {
    const text = await response.text();
    const error: any = new Error(`Fetch error (${response.status})`);
    error.status = response.status;
    error.body = text;
    throw error;
  }
  
  return response.json();
}
