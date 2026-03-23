'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AcmHeader } from '../components/AcmHeader';
import { SessionBar } from '../components/SessionBar';
import { CardGrid } from '../components/CardGrid';
import { useQuestions } from '../hooks/useQuestions';
import { useWebSocket } from '../hooks/useWebSocket';

function AudienceContent() {
  const params = useSearchParams();
  const sessionId = params.get('session') ||
    process.env.NEXT_PUBLIC_DEFAULT_SESSION_ID || '';

  const { questions, isLoading, handleWsMessage } = useQuestions(sessionId);
  const { status } = useWebSocket({ onMessage: handleWsMessage });

  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      {/* Ambient gradient background */}
      <div className="gradient-bg" />
      <div className="noise-overlay" />

      <AcmHeader status={status} />

      <SessionBar
        questionCount={questions.length}
      />

      {/* Card grid */}
      <main className="flex-1 p-6 sm:p-8">
        {isLoading ? (
          /* Central Loading Screen */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-[50vh] gap-6"
          >
            <div className="relative flex items-center justify-center w-14 h-14">
              <motion.div
                animate={{ rotate: [45, 405] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="absolute inset-0 border-2 border-[#0066CC]/20 border-t-[#0066CC]/80 rounded-[4px]"
              />
              <motion.div
                animate={{ rotate: [45, -315] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="absolute inset-2 border-[1.5px] border-[#00B4D8]/20 border-b-[#00B4D8]/80 rounded-[3px]"
              />
            </div>
            <div className="text-center">
              <p className="font-display text-lg text-[#6B7280]/80 tracking-tight">
                Synchronizing...
              </p>
              <p className="text-[11px] font-mono text-[#6B7280]/30 mt-2 tracking-wider animate-pulse">
                Establishing uplink
              </p>
            </div>
          </motion.div>
        ) : questions.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="flex flex-col items-center justify-center h-[50vh] gap-5"
          >
            <div
              className="w-14 h-14 border-2 border-[#0066CC]/20 diamond-float"
              style={{ borderRadius: '4px' }}
            />
            <div className="text-center">
              <p className="font-display text-lg text-[#6B7280]/80 tracking-tight">
                Waiting for questions
              </p>
              <p className="text-[11px] font-mono text-[#6B7280]/30 mt-2 tracking-wider">
                Questions will appear here in real-time
              </p>
            </div>
          </motion.div>
        ) : (
          <CardGrid questions={questions} />
        )}
      </main>

      {/* Bottom accent line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#0066CC]/15 to-transparent" />
    </div>
  );
}

export default function AudiencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066CC]/30 border-t-[#0066CC] rounded-full animate-spin" />
      </div>
    }>
      <AudienceContent />
    </Suspense>
  );
}
