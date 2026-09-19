import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, Loader2, Trash2 } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useAiStore } from '../stores/aiStore';
import { cn } from '../utils/cn';

const SUGGESTIONS = [
  'How many shipments are currently in transit?',
  'Which shipments are stuck in customs?',
  'Any flagged shipments I should worry about?',
  "Summarize today's shipment operations",
  'Tips for faster customs clearance in Lebanon',
];

export default function AiAssistant() {
  const messages = useAiStore((s) => s.messages);
  const loading = useAiStore((s) => s.loading);
  const error = useAiStore((s) => s.error);
  const send = useAiStore((s) => s.send);
  const clear = useAiStore((s) => s.clear);

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    void send(msg);
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">TransFex AI</h1>
            <p className="text-xs text-slate-400">Ask about your shipments</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="ml-auto p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto rounded-2xl glass-card p-4 space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/20 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">How can I help?</h2>
              <p className="text-sm text-slate-400 mb-6 max-w-sm">
                I have context on all your shipments. Ask me about statuses, ETAs, customs, or logistics tips.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="text-left px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/30 text-xs text-slate-300 hover:border-brand-500/30 hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-brand-400" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-slate-800/50 text-slate-200 border border-slate-700/30 rounded-bl-md'
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <p
                    className={cn(
                      'text-[10px] mt-2',
                      msg.role === 'user' ? 'text-brand-200' : 'text-slate-500'
                    )}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shrink-0 mt-1 text-white font-bold text-xs">
                    H
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-brand-400" />
              </div>
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="text-center py-2">
              <p className="text-xs text-rose-400 bg-rose-500/10 px-3 py-2 rounded-lg inline-block">
                {error}
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about your shipments..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
            className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/50 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/50 focus:shadow-lg focus:shadow-brand-500/10 transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </PageContainer>
  );
}