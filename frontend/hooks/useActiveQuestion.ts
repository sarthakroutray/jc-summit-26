'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActiveQuestionResponse, VoteQuestion, VoteOption } from '../types';

const POLL_INTERVAL = 2500; // 2.5 seconds

export function useActiveQuestion() {
  const [question, setQuestion] = useState<VoteQuestion | null>(null);
  const [options, setOptions] = useState<VoteOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const fetchActiveQuestion = useCallback(async () => {
    try {
      const res = await fetch('/api/active-question');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: ActiveQuestionResponse = await res.json();

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
    fetchActiveQuestion();
    intervalRef.current = setInterval(fetchActiveQuestion, POLL_INTERVAL);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchActiveQuestion]);

  return { question, options, isLoading, error, refetch: fetchActiveQuestion };
}
