'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ResultsResponse, VoteQuestion, VoteOption } from '../types';

const POLL_INTERVAL = 1000; // 1 second

export function useResults() {
  const [question, setQuestion] = useState<VoteQuestion | null>(null);
  const [options, setOptions] = useState<VoteOption[]>([]);
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
    intervalRef.current = setInterval(fetchResults, POLL_INTERVAL);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchResults]);

  return { question, options, isLoading, error, refetch: fetchResults };
}
