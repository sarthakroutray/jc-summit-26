'use client';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useResults } from '../../hooks/useResults';
import type { VoteOption } from '../../types';

const PIE_COLORS = ['#0066CC', '#00B4D8', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#14B8A6'];

function PieChart({ options, size = 280 }: { options: VoteOption[]; size?: number }) {
  const totalVotes = options.reduce((sum, o) => sum + o.vote_count, 0);
  const center = size / 2;
  const radius = size / 2 - 8;

  const slices = useMemo(() => {
    if (totalVotes === 0) return [];

    let startAngle = -Math.PI / 2;
    return options.map((opt, i) => {
      const fraction = opt.vote_count / totalVotes;
      const angle = fraction * 2 * Math.PI;
      const endAngle = startAngle + angle;

      const largeArc = angle > Math.PI ? 1 : 0;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const path = options.length === 1
        ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.001} ${center - radius} Z`
        : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const result = {
        path,
        color: PIE_COLORS[i % PIE_COLORS.length],
        fraction,
        opt,
      };

      startAngle = endAngle;
      return result;
    });
  }, [options, totalVotes, center, radius]);

  if (totalVotes === 0) {
    return (
      <div className="flex items-center justify-center w-full aspect-square max-w-[280px] mx-auto">
        <div className="text-center">
          <div
            className="w-14 h-14 mx-auto border-2 border-[#0066CC]/20 diamond-float mb-4"
            style={{ borderRadius: '4px' }}
          />
          <p className="text-[11px] font-mono text-[#6B7280]/40 tracking-wider">No votes yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-square max-w-[280px] mx-auto">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => (
        <motion.path
          key={slice.opt.id}
          d={slice.path}
          fill={slice.color}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 25 }}
          style={{ transformOrigin: `${center}px ${center}px` }}
          stroke="#0A0A0F"
          strokeWidth="2"
        />
      ))}
      {/* Center cutout for donut style */}
      <circle cx={center} cy={center} r={radius * 0.55} fill="#0A0A0F" />
      <text
        x={center}
        y={center - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#F0F4FF"
        fontSize="28"
        fontWeight="800"
        fontFamily="var(--font-display)"
      >
        {totalVotes}
      </text>
      <text
        x={center}
        y={center + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#6B7280"
        fontSize="10"
        fontFamily="monospace"
        letterSpacing="0.15em"
      >
        VOTES
      </text>
    </svg>
    </div>
  );
}

export default function DashboardPage() {
  const { question, options, pollingEnabled, isLoading } = useResults();

  const totalVotes = options.reduce((sum, o) => sum + o.vote_count, 0);
  const maxVotes = Math.max(...options.map(o => o.vote_count), 0);
  const winners = options.filter(o => o.vote_count === maxVotes && maxVotes > 0);

  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      <div className="gradient-bg" />
      <div className="noise-overlay" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-white/[0.06]"
        style={{ backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src="/acm-logo.png"
              alt="ACM Logo"
              width={48}
              height={48}
              className="object-contain drop-shadow-[0_0_12px_rgba(0,102,204,0.3)]"
              priority
            />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-mono text-[#0066CC] tracking-[0.25em] uppercase leading-none mb-1">
              ACM — Manipal University Jaipur
            </p>
            <h1 className="font-display text-xl font-bold text-[#F0F4FF] leading-none tracking-tight">
              JC Summit — Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block w-24 h-[1px] bg-gradient-to-r from-transparent via-[#0066CC]/30 to-transparent" />
          <div className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: pollingEnabled ? '#10B981' : '#F59E0B',
                boxShadow: pollingEnabled
                  ? '0 0 8px rgba(16,185,129,0.4)'
                  : '0 0 8px rgba(245,158,11,0.35)',
              }}
              animate={pollingEnabled ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : { scale: 1, opacity: 1 }}
              transition={pollingEnabled ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
            />
            <span className="text-[10px] font-mono text-[#6B7280] tracking-wider uppercase">
              {pollingEnabled ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="flex-1 p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] gap-6"
            >
              <div className="relative flex items-center justify-center w-14 h-14">
                <motion.div
                  animate={{ rotate: [45, 405] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute inset-0 border-2 border-[#0066CC]/20 border-t-[#0066CC]/80 rounded-[4px]"
                />
              </div>
              <p className="font-display text-lg text-[#6B7280]/80 tracking-tight">Loading results...</p>
            </motion.div>
          ) : !question ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] gap-5"
            >
              <div className="w-14 h-14 border-2 border-[#0066CC]/20 diamond-float" style={{ borderRadius: '4px' }} />
              <div className="text-center">
                <p className="font-display text-lg text-[#6B7280]/80 tracking-tight">No active question</p>
                <p className="text-[11px] font-mono text-[#6B7280]/30 mt-2 tracking-wider">
                  Waiting for the admin to activate a question
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={question.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Question */}
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 sm:p-8 mb-8"
                style={{
                  background: '#12121A',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
              >
                <p className="text-[9px] font-mono text-[#0066CC] uppercase tracking-[0.25em] mb-3">
                  Active Question
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F0F4FF] tracking-tight leading-tight">
                  {question.text}
                </h2>
              </motion.div>

              {/* Results grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl p-6 flex items-center justify-center"
                  style={{
                    background: '#12121A',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <PieChart options={options} />
                </motion.div>

                {/* Vote breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: '#12121A',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <h3 className="text-[10px] font-mono text-[#6B7280]/60 uppercase tracking-[0.2em] mb-5">
                    Vote Distribution
                  </h3>

                  <div className="space-y-4">
                    {options.map((opt, i) => {
                      const color = PIE_COLORS[i % PIE_COLORS.length];
                      const percentage = totalVotes > 0 ? (opt.vote_count / totalVotes) * 100 : 0;
                      const isWinner = winners.some(w => w.id === opt.id);

                      return (
                        <motion.div
                          key={opt.id}
                          layout
                          className="relative"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className={`font-display text-sm tracking-tight ${isWinner ? 'text-[#F0F4FF] font-bold' : 'text-[#F0F4FF]/80'}`}>
                                {opt.text}
                              </span>
                              {isWinner && totalVotes > 0 && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="text-[9px] font-mono text-[#F59E0B] uppercase tracking-wider px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
                                >
                                  Leading
                                </motion.span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-[#6B7280] tabular-nums">
                              {opt.vote_count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Total */}
                  <div className="mt-6 pt-4 border-t border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#6B7280]/60 uppercase tracking-wider">Total Votes</span>
                      <span className="font-display text-xl font-bold text-[#F0F4FF] tabular-nums">{totalVotes}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#0066CC]/15 to-transparent" />
    </div>
  );
}
