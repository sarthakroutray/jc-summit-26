'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import type { QuestionWithOptions } from '../../types';

export default function AdminPage() {
  const { user, isLoading: authLoading, isAdmin, signIn, signOut, getAuthHeader } = useAdminAuth();

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Question form state
  const [questionText, setQuestionText] = useState('');
  const [optionInputs, setOptionInputs] = useState(['', '']);
  const [isSending, setIsSending] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Questions list
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/questions', {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch {
      // silent
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    if (isAdmin) fetchQuestions();
  }, [isAdmin, fetchQuestions]);

  // ── Sign in ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSigningIn(true);
    const error = await signIn(email.trim(), password);
    if (error) {
      setLoginError(error.message || 'Invalid credentials');
      setPassword('');
    }
    setIsSigningIn(false);
  };

  // ── Add question ──
  const handleAddQuestion = async () => {
    const trimmedText = questionText.trim();
    const validOptions = optionInputs.map(o => o.trim()).filter(Boolean);
    if (!trimmedText) { setFormMessage({ type: 'error', text: 'Question text is required' }); return; }
    if (validOptions.length < 2) { setFormMessage({ type: 'error', text: 'At least 2 options required' }); return; }

    setIsSending(true);
    setFormMessage(null);

    try {
      const res = await fetch('/api/admin/add-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ text: trimmedText, options: validOptions }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormMessage({ type: 'success', text: 'Question added!' });
        setQuestionText('');
        setOptionInputs(['', '']);
        fetchQuestions();
        setTimeout(() => setFormMessage(null), 2500);
      } else {
        setFormMessage({ type: 'error', text: data.error || 'Failed to add question' });
      }
    } catch {
      setFormMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsSending(false);
    }
  };

  // ── Activate question ──
  const handleActivate = async (questionId: string) => {
    try {
      await fetch('/api/admin/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ question_id: questionId }),
      });
      fetchQuestions();
    } catch { /* silent */ }
  };

  // ── Deactivate session ──
  const handleDeactivate = async () => {
    try {
      await fetch('/api/admin/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      fetchQuestions();
    } catch { /* silent */ }
  };

  // ── Delete question ──
  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this question? This cannot be undone.')) return;
    try {
      await fetch('/api/admin/delete-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ question_id: questionId }),
      });
      fetchQuestions();
    } catch { /* silent */ }
  };

  // ── Reset votes ──
  const handleResetVotes = async (questionId: string) => {
    if (!confirm('Reset all votes for this question?')) return;
    try {
      await fetch('/api/admin/reset-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ question_id: questionId }),
      });
      fetchQuestions();
    } catch { /* silent */ }
  };

  // Option helpers
  const addOption = () => { if (optionInputs.length < 8) setOptionInputs([...optionInputs, '']); };
  const removeOption = (i: number) => { if (optionInputs.length > 2) setOptionInputs(optionInputs.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, v: string) => { const a = [...optionInputs]; a[i] = v; setOptionInputs(a); };

  // ── Loading state ──
  if (authLoading) {
    return (
      <div className="min-h-[100dvh] relative flex items-center justify-center">
        <div className="gradient-bg" /><div className="noise-overlay" />
        <div className="w-8 h-8 border-2 border-[#0066CC]/30 border-t-[#0066CC] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Login Screen (not signed in, OR signed in but not an admin) ──
  if (!user || !isAdmin) {
    return (
      <div className="min-h-[100dvh] relative flex items-center justify-center">
        <div className="gradient-bg" />
        <div className="noise-overlay" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="relative z-10 w-full max-w-sm px-6"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-16 h-16 mb-6">
              <Image src="/acm-logo.png" alt="ACM Logo" fill className="object-contain" priority />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-2">Admin System</h1>
            <p className="text-[11px] font-mono text-[#00B4D8] uppercase tracking-[0.2em]">Secure Access Required</p>
          </div>

          {/* Show "not an admin" message if signed in but not admin */}
          {user && !isAdmin && (
            <div className="mb-5 rounded-xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-red-400 text-[11px] font-mono tracking-wider">
                {user.email} is not an admin.
              </p>
              <button onClick={signOut} className="mt-2 text-[10px] font-mono text-[#6B7280]/60 hover:text-[#6B7280] transition-colors uppercase tracking-wider">
                Sign out
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#12121A]/80 border border-[#ffffff]/10 rounded-xl px-4 py-3 text-sm font-mono
                         focus:outline-none focus:border-[#0066CC]/50 focus:ring-1 focus:ring-[#0066CC]/50
                         transition-all placeholder-[#6B7280]/30 text-white backdrop-blur-md"
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={`w-full bg-[#12121A]/80 border ${loginError ? 'border-red-500/50' : 'border-[#ffffff]/10'}
                         rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#0066CC]/50
                         focus:ring-1 focus:ring-[#0066CC]/50 transition-all placeholder-[#6B7280]/30 text-white backdrop-blur-md`}
            />
            <AnimatePresence>
              {loginError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-[11px] text-center tracking-widest font-mono pt-1"
                >
                  {loginError}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isSigningIn}
              className="w-full bg-gradient-to-r from-[#0066CC]/20 to-[#00B4D8]/20 hover:from-[#0066CC]/30 hover:to-[#00B4D8]/30
                         text-white border border-[#ffffff]/10 hover:border-[#ffffff]/20 rounded-xl py-3 text-[11px]
                         font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2
                         shadow-[0_0_15px_rgba(0,102,204,0.1)] backdrop-blur-md disabled:opacity-40"
            >
              {isSigningIn && (
                <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSigningIn ? 'Signing in...' : 'Authenticate'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Admin Panel ──
  return (
    <div className="min-h-[100dvh] relative">
      <div className="gradient-bg" />
      <div className="noise-overlay" />

      <div className="max-w-4xl mx-auto px-6 py-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image src="/acm-logo.png" alt="ACM Logo" width={40} height={40} className="object-contain" priority />
            </div>
            <div>
              <p className="text-[9px] font-mono text-[#0066CC] tracking-[0.25em] uppercase leading-none mb-1">
                ACM — MUJ / JC Summit
              </p>
              <h1 className="font-display text-xl font-bold tracking-tight">Admin Panel</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[10px] font-mono text-[#6B7280]/40 truncate max-w-[180px]">
              {user.email}
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign out
            </motion.button>
          </div>
        </motion.div>

        {/* Add Question Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="rounded-2xl overflow-hidden mb-8"
          style={{
            background: '#12121A',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div className="p-6">
            <h2 className="text-[10px] font-mono text-[#6B7280]/60 uppercase tracking-[0.2em] mb-5">
              New Question
            </h2>

            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddQuestion(); }}
              placeholder="Type your question here..."
              rows={2}
              maxLength={500}
              className="w-full rounded-xl px-4 py-3.5 text-[#F0F4FF] text-sm leading-relaxed
                         placeholder-[#6B7280]/40 font-body resize-none transition-all duration-200
                         focus:outline-none focus:ring-1 focus:ring-[#0066CC]/30"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
            />

            <div className="mt-4 space-y-2">
              <label className="text-[9px] font-mono text-[#6B7280]/50 uppercase tracking-widest block">
                Options
              </label>
              {optionInputs.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 rounded-lg px-3 py-2.5 text-[#F0F4FF] text-sm font-body
                               placeholder-[#6B7280]/30 transition-all focus:outline-none focus:ring-1 focus:ring-[#0066CC]/30"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                  {optionInputs.length > 2 && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeOption(i)}
                      className="px-2 text-red-400/40 hover:text-red-400 transition-colors">
                      ✕
                    </motion.button>
                  )}
                </div>
              ))}
              {optionInputs.length < 8 && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={addOption}
                  className="text-[11px] font-mono text-[#0066CC]/60 hover:text-[#0066CC] transition-colors tracking-wider">
                  + Add Option
                </motion.button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-5 gap-4">
              <AnimatePresence>
                {formMessage && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`text-[11px] font-mono tracking-wider ${formMessage.type === 'success' ? 'text-[#10B981]' : 'text-red-400'}`}
                  >
                    {formMessage.text}
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.97, y: 1 }}
                onClick={handleAddQuestion}
                disabled={isSending}
                className="w-full sm:w-auto sm:ml-auto px-6 py-2.5 text-white text-[11px] font-display font-semibold
                           rounded-xl transition-all duration-200 uppercase tracking-wider
                           disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: isSending ? '#00B4D8' : 'linear-gradient(135deg, #0066CC, #0052A3)',
                  boxShadow: questionText.trim() ? '0 4px 20px rgba(0,102,204,0.25)' : 'none',
                }}
              >
                {isSending ? 'Adding...' : 'Add Question'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-mono text-[#6B7280]/60 uppercase tracking-[0.2em]">
              All Questions
              <span className="ml-2 text-[#6B7280]/30 tabular-nums">({questions.length})</span>
            </h2>
            <motion.button whileTap={{ scale: 0.95 }} onClick={fetchQuestions}
              className="text-[10px] font-mono text-[#0066CC]/60 hover:text-[#0066CC] transition-colors uppercase tracking-wider">
              Refresh
            </motion.button>
          </div>

          {isLoadingQuestions ? (
            <div className="rounded-2xl p-10 flex items-center justify-center"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-6 h-6 border-2 border-[#0066CC]/30 border-t-[#0066CC] rounded-full animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl p-10 flex flex-col items-center gap-3"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-10 h-10 border border-[#0066CC]/15 diamond-float" style={{ borderRadius: '3px' }} />
              <p className="text-[11px] font-mono text-[#6B7280]/30 tracking-wider">No questions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {questions.map(q => {
                  const totalVotes = q.options.reduce((s, o) => s + o.vote_count, 0);
                  return (
                    <motion.div
                      key={q.id} layout
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        background: '#12121A',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        borderColor: q.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
                        borderLeftWidth: '3px',
                        borderLeftColor: q.is_active ? '#10B981' : '#0066CC',
                      }}
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {q.is_active && (
                              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                                Active
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-[#6B7280]/40 tabular-nums">
                              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#6B7280]/30">
                            {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="font-display text-lg text-[#F0F4FF] tracking-tight mb-3">{q.text}</p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {q.options.map((opt, i) => (
                            <span key={opt.id} className="text-[10px] font-mono px-2 py-1 rounded-md"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#6B7280' }}>
                              {String.fromCharCode(65 + i)}: {opt.text} ({opt.vote_count})
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-0 mt-2 sm:mt-0">
                          <div className="flex flex-wrap items-center gap-3">
                            {!q.is_active ? (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleActivate(q.id)}
                                className="text-[10px] font-mono text-[#10B981]/60 hover:text-[#10B981] transition-colors uppercase tracking-wider">
                                Activate
                              </motion.button>
                            ) : (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={handleDeactivate}
                                className="text-[10px] font-mono text-red-400/80 hover:text-red-400 transition-colors uppercase tracking-wider">
                                Deactivate
                              </motion.button>
                            )}
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleResetVotes(q.id)}
                              className="text-[10px] font-mono text-[#F59E0B]/40 hover:text-[#F59E0B] transition-colors uppercase tracking-wider">
                              Reset Votes
                            </motion.button>
                          </div>
                          
                          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleDelete(q.id)}
                            className="p-1.5 rounded-md text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete Question">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
