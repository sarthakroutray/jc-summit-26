'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Question, WsMessage } from '../types';

export function useQuestions(sessionId: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { setIsLoading(false); return; }
    
    const startTime = Date.now();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions?session_id=${sessionId}`)
      .then(r => r.json())
      .then((data: Question[]) => {
        setQuestions(data);
        const timePassed = Date.now() - startTime;
        const delay = Math.max(0, 1100 - timePassed);
        setTimeout(() => setIsLoading(false), delay);
      })
      .catch(err => {
        setError(err.message);
        setTimeout(() => setIsLoading(false), Math.max(0, 1100 - (Date.now() - startTime)));
      });
  }, [sessionId]);

  const handleWsMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case 'question_added':
        if (msg.question) {
          setQuestions(prev => [msg.question!, ...prev]);
        }
        break;
      case 'question_deleted':
        if (msg.questionId) {
          setQuestions(prev => prev.filter(q => q.id !== msg.questionId));
        }
        break;
      case 'session_cleared':
        setQuestions([]);
        break;
    }
  }, []);

  return { questions, isLoading, error, handleWsMessage };
}
