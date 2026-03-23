'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const ROUTES = [
  {
    href: '/vote',
    title: 'Vote',
    description: 'Cast your vote on the active question',
    accent: '#0066CC',
    icon: '🗳️',
  },
  {
    href: '/dashboard',
    title: 'Dashboard',
    description: 'Live results with charts and analytics',
    accent: '#00B4D8',
    icon: '📊',
  },
  {
    href: '/admin',
    title: 'Admin',
    description: 'Manage questions and control the session',
    accent: '#8B5CF6',
    icon: '⚙️',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      <div className="gradient-bg" />
      <div className="noise-overlay" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        className="flex items-center justify-center px-4 sm:px-8 py-5 border-b border-white/[0.06]"
        style={{ backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
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
              JC Summit — LiveCards
            </h1>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-3xl font-bold text-[#F0F4FF] tracking-tight mb-3">
              Live Voting System
            </h2>
            <p className="text-sm text-[#6B7280]/80 font-body">
              Select your destination
            </p>
          </motion.div>

          <div className="space-y-4">
            {ROUTES.map((route, i) => (
              <motion.div
                key={route.href}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25, delay: i * 0.08 }}
              >
                <Link href={route.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group rounded-2xl p-5 cursor-pointer transition-all duration-200"
                    style={{
                      background: '#12121A',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderLeftWidth: '3px',
                      borderLeftColor: route.accent,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{route.icon}</span>
                      <div>
                        <p className="font-display text-lg font-bold text-[#F0F4FF] tracking-tight group-hover:text-white transition-colors">
                          {route.title}
                        </p>
                        <p className="text-[11px] text-[#6B7280]/60 font-mono tracking-wider mt-0.5">
                          {route.description}
                        </p>
                      </div>
                      <svg className="ml-auto w-5 h-5 text-[#6B7280]/30 group-hover:text-[#6B7280] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#0066CC]/15 to-transparent" />
    </div>
  );
}
