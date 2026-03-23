'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { WsMessage, WsStatus } from '../types';

const CATEGORIES = ['Technical', 'General', 'Panel', 'Lightning'];
const COLORS = ['#0066CC', '#0EA5E9', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'];

interface Props {
  sessionId: string;
  secret: string;
  sendMessage: (data: WsMessage) => void;
  status: WsStatus;
}

export function AdminForm({ sessionId, secret, sendMessage, status }: Props) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('General');
  const [color, setColor] = useState(COLORS[0]);
  const [isSending, setIsSending] = useState(false);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 300) return;
    setIsSending(true);
    const msg: WsMessage = {
      type: 'new_question',
      secret,
      sessionId,
      text: trimmed,
      category,
      color,
    };
    sendMessage(msg);
    setText('');
    setTimeout(() => setIsSending(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      send();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="rounded-2xl overflow-hidden"
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
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question here..."
          rows={3}
          maxLength={300}
          className="w-full rounded-xl px-4 py-3.5 text-[#F0F4FF] text-sm leading-relaxed
                     placeholder-[#6B7280]/40 font-body resize-none transition-all duration-200
                     focus:outline-none focus:ring-1 focus:ring-[#0066CC]/30"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />

        <div className="flex flex-wrap gap-5 items-end mt-5">
          {/* Category */}
          <div>
            <label className="text-[9px] font-mono text-[#6B7280]/50 uppercase tracking-widest block mb-2">
              Category
            </label>
            <div className="flex gap-1.5">
              {CATEGORIES.map(c => (
                <motion.button
                  key={c}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                    category === c
                      ? 'text-white'
                      : 'text-[#6B7280]/60 hover:text-[#6B7280]'
                  }`}
                  style={{
                    background: category === c ? `${COLORS[CATEGORIES.indexOf(c)] || '#0066CC'}20` : 'transparent',
                    border: `1px solid ${category === c ? `${COLORS[CATEGORIES.indexOf(c)] || '#0066CC'}30` : 'rgba(255,255,255,0.04)'}`,
                  }}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[9px] font-mono text-[#6B7280]/50 uppercase tracking-widest block mb-2">
              Accent
            </label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <motion.button
                  key={c}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.15 }}
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px #12121A, 0 0 0 3.5px ${c}60` : 'none',
                    opacity: color === c ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Send */}
          <motion.button
            whileTap={{ scale: 0.97, y: 1 }}
            onClick={send}
            disabled={!text.trim() || status !== 'open'}
            className="ml-auto px-6 py-2.5 text-white text-[11px] font-display font-semibold
                       rounded-xl transition-all duration-200 uppercase tracking-wider
                       disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: isSending
                ? '#00B4D8'
                : 'linear-gradient(135deg, #0066CC, #0052A3)',
              boxShadow: text.trim() && status === 'open'
                ? '0 4px 20px rgba(0,102,204,0.25)'
                : 'none',
            }}
          >
            {isSending ? 'Sent' : 'Send Question'}
          </motion.button>
        </div>

        <p className="text-[9px] text-[#6B7280]/30 mt-3 text-right font-mono tabular-nums">
          {text.length}/300
          <span className="ml-2 text-[#6B7280]/20">Ctrl+Enter to send</span>
        </p>
      </div>
    </motion.div>
  );
}
