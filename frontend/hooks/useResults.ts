'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ResultsResponse, VoteQuestion, VoteOption } from '../types';

const ACTIVE_POLL_INTERVAL = 1000; // 1 second when enabled
const IDLE_POLL_INTERVAL = 30000; // 30 seconds when disabled

export function useResults() {
  const [question, setQuestion] = useState<VoteQuestion | null>(null);
  const [options, setOptions] = useState<VoteOption[]>([]);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/results');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: ResultsResponse = await res.json();

      if (isMounted.current) {
        setQuestion(data.question);
        setOptions(data.options);
        setPollingEnabled(data.polling_enabled ?? true);
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchResults();

    const intervalMs = pollingEnabled ? ACTIVE_POLL_INTERVAL : IDLE_POLL_INTERVAL;
    intervalRef.current = setInterval(fetchResults, intervalMs);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchResults, pollingEnabled]);

  return { question, options, pollingEnabled, isLoading, error, refetch: fetchResults };
}
