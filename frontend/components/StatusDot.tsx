'use client';
import { motion } from 'framer-motion';
import type { WsStatus } from '../types';

const STATUS_CONFIG: Record<WsStatus, { color: string; glowColor: string; label: string }> = {
  open:       { color: '#10B981', glowColor: 'rgba(16,185,129,0.4)', label: 'Live' },
  connecting: { color: '#F59E0B', glowColor: 'rgba(245,158,11,0.4)', label: 'Connecting' },
  closed:     { color: '#EF4444', glowColor: 'rgba(239,68,68,0.4)',  label: 'Reconnecting' },
  error:      { color: '#EF4444', glowColor: 'rgba(239,68,68,0.4)',  label: 'Disconnected' },
};

export function StatusDot({ status }: { status: WsStatus }) {
  const { color, glowColor, label } = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${glowColor}` }}
        animate={
          status === 'open'
            ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }
            : status === 'connecting'
            ? { scale: [1, 1.2, 1] }
            : {}
        }
        transition={{
          duration: status === 'open' ? 2 : 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span className="text-[10px] font-mono text-[#6B7280] tracking-wider uppercase">{label}</span>
    </div>
  );
}
