'use client';
import { motion } from 'framer-motion';
import type { WsStatus } from '../types';

interface Props {
  sessionTitle?: string;
  questionCount: number;
  status?: WsStatus;
  onClearBoard?: () => void;
}

export function SessionBar({ sessionTitle, questionCount, status, onClearBoard }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.15 }}
      className="flex items-center justify-between px-8 py-3 border-b border-white/[0.04]"
      style={{ background: 'rgba(0,0,0,0.15)' }}
    >
      <div className="flex items-center gap-4">
        {sessionTitle && (
          <span className="text-[10px] font-mono text-[#6B7280]/60 uppercase tracking-widest">
            {sessionTitle}
          </span>
        )}
        <span className="text-[11px] font-mono text-[#6B7280] tabular-nums">
          {questionCount} question{questionCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {onClearBoard && questionCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClearBoard}
            className="text-[10px] font-mono text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-wider"
          >
            Clear Board
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
