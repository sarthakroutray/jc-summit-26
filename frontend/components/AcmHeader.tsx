'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import type { WsStatus } from '../types';
import { StatusDot } from './StatusDot';

function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
  const iteration = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    iteration.current = 0;
    intervalRef.current = setInterval(() => {
      setDisplayed(
        text
          .split('')
          .map((char, index) => {
            if (index < iteration.current) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      if (iteration.current >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      iteration.current += 1 / 3;
    }, 40);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  return <span className={className}>{displayed}</span>;
}

export function AcmHeader({ status }: { status?: WsStatus } = {}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 28 }}
      className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-white/[0.06]"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* ACM Logo */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative w-10 sm:w-12 h-10 sm:h-12 flex-shrink-0"
        >
          <Image
            src="/acm-logo.png"
            alt="ACM Logo"
            width={48}
            height={48}
            className="object-contain drop-shadow-[0_0_12px_rgba(0,102,204,0.3)]"
            priority
          />
        </motion.div>

        <div className="flex flex-col">
          <p className="text-[9px] sm:text-[10px] font-mono text-[#0066CC] tracking-[0.2em] sm:tracking-[0.25em] uppercase leading-none mb-1">
            ACM — Manipal University Jaipur
          </p>
          <h1 className="font-display text-lg sm:text-xl font-bold text-[#F0F4FF] leading-none tracking-tight">
            <ScrambleText text="JC Summit" />
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Subtle animated line */}
        <div className="hidden sm:block w-24 h-[1px] bg-gradient-to-r from-transparent via-[#0066CC]/30 to-transparent" />

        {/* Live indicator */}
        {status && (
          <div className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]">
            <StatusDot status={status} />
          </div>
        )}
      </div>
    </motion.header>
  );
}
