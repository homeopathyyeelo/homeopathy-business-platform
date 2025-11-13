'use client';

import { ReactNode, useEffect } from 'react';
import { SWRConfig } from 'swr';

const BC_CHANNEL = 'yeelo-swr-cache';

function setupBroadcastChannel(cache: Map<any, any>) {
  if (typeof window === 'undefined') return () => {};
  
  const bc = new BroadcastChannel(BC_CHANNEL);
  
  // Listen for cache updates from other tabs
  bc.onmessage = (ev) => {
    const { key, value } = ev.data || {};
    if (key && value !== undefined) {
      cache.set(key, value);
    }
  };
  
  // Intercept cache.set to broadcast updates
  const originalSet = cache.set.bind(cache);
  cache.set = (key: any, value: any) => {
    originalSet(key, value);
    try {
      bc.postMessage({ key, value });
    } catch (e) {
      // Ignore postMessage errors for non-serializable data
    }
    return cache;
  };
  
  return () => bc.close();
}

/**
 * Enterprise SWR provider with cross-tab cache synchronization
 */
export function SWRBroadcastProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: () => {
          const map = new Map();
          if (typeof window !== 'undefined') {
            setupBroadcastChannel(map);
          }
          return map;
        },
        dedupingInterval: 60000, // 1 minute deduplication
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        errorRetryCount: 1,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
