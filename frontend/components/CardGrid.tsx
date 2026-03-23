'use client';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { QuestionCard } from './QuestionCard';
import type { Question } from '../types';

interface Props {
  questions: Question[];
  onDelete?: (id: string) => void;
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 26 },
  },
};

export function CardGrid({ questions, onDelete }: Props) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max"
    >
      <AnimatePresence mode="popLayout">
        {questions.map((q, i) => (
          <motion.div key={q.id} variants={itemVariants} layout>
            <QuestionCard
              question={q}
              index={i}
              isNew={i === 0}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
