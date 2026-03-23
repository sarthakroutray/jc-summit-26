'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { QuestionCard } from '../../components/QuestionCard';
import { StatusDot } from '../../components/StatusDot';
import { AdminForm } from '../../components/AdminForm';
import { useQuestions } from '../../hooks/useQuestions';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  const sessionId = process.env.NEXT_PUBLIC_DEFAULT_SESSION_ID || '';
  const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET || '';

  const { questions, handleWsMessage } = useQuestions(sessionId);
  const { sendMessage, status } = useWebSocket({ onMessage: handleWsMessage });

  const deleteQuestion = (id: string) => {
    if (!isAuthenticated) return;
    sendMessage({ type: 'delete_question', secret, questionId: id });
  };

  const clearBoard = () => {
    if (!isAuthenticated) return;
    if (!confirm('Clear all questions from the board?')) return;
    sendMessage({ type: 'clear_session', secret, sessionId });
  };

  if (!isAuthenticated) {
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
            <p className="text-[11px] font-mono text-[#00B4D8] uppercase tracking-[0.2em] shadow-[#00B4D8]/20 drop-shadow-md">Secure Access Required</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter secret..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-[#12121A]/80 border ${
                  error ? 'border-red-500/50' : 'border-[#ffffff]/10'
                } rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#0066CC]/50 focus:ring-1 focus:ring-[#0066CC]/50 transition-all placeholder-[#6B7280]/30 text-white backdrop-blur-md`}
                autoFocus
              />
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="text-red-400 text-[11px] text-center tracking-widest font-mono"
                  >
                    ACCESS DENIED
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-gradient-to-r from-[#0066CC]/20 to-[#00B4D8]/20 hover:from-[#0066CC]/30 hover:to-[#00B4D8]/30 text-white border border-[#ffffff]/10 hover:border-[#ffffff]/20 rounded-xl py-3 text-[11px] font-mono tracking-wider uppercase transition-all flex items-center justify-center shadow-[0_0_15px_rgba(0,102,204,0.1)] backdrop-blur-md"
            >
              Authenticate
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative">
      {/* Background */}
      <div className="gradient-bg" />
      <div className="noise-overlay" />

      <div className="max-w-4xl mx-auto px-6 py-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/acm-logo.png"
                alt="ACM Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-[9px] font-mono text-[#0066CC] tracking-[0.25em] uppercase leading-none mb-1">
                ACM — MUJ / JC Summit
              </p>
              <h1 className="font-display text-xl font-bold tracking-tight">Admin Panel</h1>
            </div>
          </div>
          <StatusDot status={status} />
        </motion.div>

        {/* Form */}
        <div className="mb-8">
          <AdminForm
            sessionId={sessionId}
            secret={secret}
            sendMessage={sendMessage}
            status={status}
          />
        </div>

        {/* Live log */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-mono text-[#6B7280]/60 uppercase tracking-[0.2em]">
              Live Board
              <span className="ml-2 text-[#6B7280]/30 tabular-nums">({questions.length})</span>
            </h2>
            {questions.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={clearBoard}
                className="text-[10px] font-mono text-red-400/40 hover:text-red-400 transition-colors uppercase tracking-wider"
              >
                Clear Board
              </motion.button>
            )}
          </div>

          {questions.length === 0 ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center justify-center gap-3"
              style={{
                background: '#12121A',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="w-10 h-10 border border-[#0066CC]/15 diamond-float"
                style={{ borderRadius: '3px' }}
              />
              <p className="text-[11px] font-mono text-[#6B7280]/30 tracking-wider">
                No questions yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    isNew={i === 0}
                    onDelete={deleteQuestion}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
