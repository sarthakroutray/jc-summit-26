'use client';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useRef, type MouseEvent } from 'react';
import type { Question } from '../types';

interface Props {
  question: Question;
  index: number;
  isNew?: boolean;
  onDelete?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Technical': '#0066CC',
  'General':   '#0EA5E9',
  'Panel':     '#8B5CF6',
  'Lightning': '#F59E0B',
};

export function QuestionCard({ question, index, isNew = false, onDelete }: Props) {
  const accent = question.color ||
    (question.category ? CATEGORY_COLORS[question.category] : '#0066CC');

  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightBackground = useTransform(
    [mouseX, mouseY],
    ([x, y]) =>
      `radial-gradient(400px circle at ${x}px ${y}px, ${accent}08, transparent 60%)`
  );

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={isNew ? { opacity: 0, y: 32, scale: 0.96 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      onMouseMove={handleMouseMove}
      className="group relative rounded-2xl overflow-hidden"
      style={{
        background: '#12121A',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeftWidth: '3px',
        borderLeftColor: accent,
      }}
    >
      {/* Spotlight border glow following cursor */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: spotlightBackground }}
      />

      {/* Inner refraction edge (liquid glass) */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Card index badge */}
        <span className="absolute top-4 right-4 text-[10px] font-mono text-white/15 tabular-nums">
          #{String(index + 1).padStart(2, '0')}
        </span>

        {/* Category badge */}
        {question.category && (
          <motion.span
            initial={isNew ? { opacity: 0, x: -8 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
            className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full mb-3 uppercase tracking-wider"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            {question.category}
          </motion.span>
        )}

        {/* Question text */}
        <p className="font-display text-lg sm:text-xl leading-snug text-[#F0F4FF] pr-8 tracking-tight">
          {question.text}
        </p>

        {/* Timestamp */}
        <p className="mt-4 text-[10px] text-[#6B7280]/60 font-mono tabular-nums">
          {new Date(question.created_at).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit'
          })}
        </p>

        {/* Admin delete button */}
        {onDelete && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onDelete(question.id)}
            className="absolute bottom-4 right-4 text-[10px] text-[#6B7280]/40 hover:text-red-400 transition-colors font-mono uppercase tracking-wider"
          >
            Remove
          </motion.button>
        )}
      </div>

      {/* Entrance shimmer on new cards */}
      {isNew && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${accent}0A, transparent 60%)` }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2, delay: 0.3 }}
        />
      )}
    </motion.div>
  );
}
