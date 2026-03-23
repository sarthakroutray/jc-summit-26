'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useActiveQuestion } from '../../hooks/useActiveQuestion';
import { supabaseClient } from '../../lib/supabase';
import type { VoteOption } from '../../types';
import type { Session } from '@supabase/supabase-js';

// Fast UI check, actual validation happens on API
function getVotedQuestions(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem('jc_voted_questions');
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function markVoted(questionId: string) {
  const voted = getVotedQuestions();
  voted.add(questionId);
  localStorage.setItem('jc_voted_questions', JSON.stringify([...voted]));
}

export default function VotePage() {
  const { question, options, isLoading: isQuestionLoading } = useActiveQuestion();
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);

  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setVotedQuestions(getVotedQuestions());
  }, []);

  const hasVoted = question ? votedQuestions.has(question.id) : false;

  const handleGoogleSignIn = async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/vote`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
  };

  const handleVote = useCallback(async (option: VoteOption) => {
    if (!question || hasVoted || isVoting || !session) return;

    setIsVoting(true);
    setVoteError(null);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          question_id: question.id,
          option_id: option.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Already voted
          markVoted(question.id);
          setVotedQuestions(getVotedQuestions());
        } else {
          setVoteError(data.error || 'Failed to vote');
        }
      } else {
        markVoted(question.id);
        setVotedQuestions(getVotedQuestions());
        setVotedOptionId(option.id);
      }
    } catch {
      setVoteError('Network error. Please try again.');
    } finally {
      setIsVoting(false);
    }
  }, [question, hasVoted, isVoting, session]);

  const OPTION_COLORS = ['#0066CC', '#00B4D8', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#14B8A6'];

  // Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center relative">
        <div className="gradient-bg" /><div className="noise-overlay" />
        <div className="w-8 h-8 border-2 border-[#0066CC]/30 border-t-[#0066CC] rounded-full animate-spin" />
      </div>
    );
  }

  // Not Authenticated -> Google Sign In
  if (!session) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center relative">
        <div className="gradient-bg" /><div className="noise-overlay" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="relative z-10 w-full max-w-sm px-6 text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <Image src="/acm-logo.png" alt="ACM Logo" fill className="object-contain" priority />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-2">Sign in to Vote</h1>
          <p className="text-[11px] font-mono text-[#6B7280] mb-8 uppercase tracking-widest">
            Your vote is completely anonymous.
          </p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-black hover:bg-gray-100 rounded-xl py-3.5 px-4 text-[13px] font-display font-semibold transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Authenticated State -> Voting UI
  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      <div className="gradient-bg" />
      <div className="noise-overlay" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.06]"
        style={{ backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative w-10 sm:w-12 h-10 sm:h-12 flex-shrink-0">
            <Image src="/acm-logo.png" alt="ACM Logo" fill className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <p className="text-[9px] sm:text-[10px] font-mono text-[#0066CC] tracking-[0.25em] uppercase leading-none mb-1">
              ACM — MUJ
            </p>
            <h1 className="font-display text-lg sm:text-xl font-bold text-[#F0F4FF] leading-none tracking-tight">
              Live Vote
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <button
            onClick={handleSignOut}
            className="text-[9px] font-mono text-[#6B7280]/60 hover:text-red-400 transition-colors uppercase tracking-widest mb-1"
          >
            Sign out
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <motion.div
              className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full"
              style={{ backgroundColor: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.4)' }}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-[9px] sm:text-[10px] font-mono text-[#6B7280] tracking-wider uppercase">Polling</span>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {isQuestionLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-6"
            >
              <div className="relative flex items-center justify-center w-14 h-14">
                <motion.div animate={{ rotate: [45, 405] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute inset-0 border-2 border-[#0066CC]/20 border-t-[#0066CC]/80 rounded-[4px]" />
                <motion.div animate={{ rotate: [45, -315] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="absolute inset-2 border-[1.5px] border-[#00B4D8]/20 border-b-[#00B4D8]/80 rounded-[3px]" />
              </div>
            </motion.div>
          ) : !question ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-5"
            >
              <div className="w-14 h-14 border-2 border-[#0066CC]/20 diamond-float" style={{ borderRadius: '4px' }} />
              <div className="text-center">
                <p className="font-display text-lg text-[#6B7280]/80 tracking-tight">No active question</p>
                <p className="text-[11px] font-mono text-[#6B7280]/30 mt-2 tracking-wider">Waiting for the admin...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-lg"
            >
              <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] font-mono text-[#0066CC] uppercase tracking-[0.25em] mb-3">Active Question</p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F0F4FF] tracking-tight leading-tight">{question.text}</h2>
              </div>

              {hasVoted ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 text-center bg-[#10B981]/10 border border-[#10B981]/20">
                  <p className="font-display text-lg text-[#10B981] font-semibold">Vote recorded!</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {options.map((opt, i) => (
                    <motion.button
                      key={opt.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleVote(opt)} disabled={isVoting}
                      className="w-full text-left rounded-xl px-5 py-4 transition-all duration-200 disabled:opacity-50"
                      style={{
                        background: votedOptionId === opt.id ? `${OPTION_COLORS[i % 8]}20` : '#12121A',
                        borderStyle: 'solid', borderWidth: '1px',
                        borderColor: votedOptionId === opt.id ? `${OPTION_COLORS[i % 8]}40` : 'rgba(255,255,255,0.06)',
                        borderLeftWidth: '3px', borderLeftColor: OPTION_COLORS[i % 8],
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-mono font-bold"
                              style={{ background: `${OPTION_COLORS[i % 8]}15`, color: OPTION_COLORS[i % 8] }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="font-display text-[#F0F4FF] text-base">{opt.text}</span>
                      </div>
                    </motion.button>
                  ))}
                  {voteError && <p className="text-red-400 text-[11px] text-center font-mono mt-4 tracking-wider">{voteError}</p>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#0066CC]/15 to-transparent" />
    </div>
  );
}
