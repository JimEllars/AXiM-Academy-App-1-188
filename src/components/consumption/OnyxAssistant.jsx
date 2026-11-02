import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';
import { trackAcademyEvent } from '../../lib/utils';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { ONYX_DOMAIN_CONTEXT, summonOnyx } from '../../lib/onyx';

/**
 * Onyx AI tutor panel.
 *
 * Talks to the edge summon endpoint with `domain_context: "academy"` and the
 * learner's session token. The browser holds no internal key: the satellite-to-
 * Core relay is signed at the edge, where the key lives. Failures are reported
 * as failures — a fabricated answer that reads like a real one is worse than an
 * outage nobody notices.
 */
export default function OnyxAssistant({ courseTitle, lessonId, lessonTitle = null }) {
  const { aiChatHistory, addAiMessage } = useAcademyStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onyxError, setOnyxError] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiChatHistory, isTyping, onyxError]);

  const askOnyx = async (question, history) => {
    const startedAt = Date.now();
    setOnyxError(null);
    setIsTyping(true);
    setLastQuery(question);

    addAiMessage({ role: 'user', content: question });
    trackAcademyEvent('AI_ASSISTANT_QUERY_SUBMITTED', {
      lessonId,
      courseTitle,
      domainContext: ONYX_DOMAIN_CONTEXT,
    });

    try {
      let accessToken = null;
      if (supabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token ?? null;
      }
      if (!accessToken) {
        throw Object.assign(new Error('Sign in to talk to Onyx.'), { code: 'NO_SESSION', retryable: false });
      }

      const result = await summonOnyx({
        message: question,
        courseTitle,
        lessonId,
        lessonTitle,
        history,
        accessToken,
      });

      addAiMessage({ role: 'assistant', content: result.answer });
      trackAcademyEvent('AI_ASSISTANT_RESPONSE_RESOLVED', {
        lessonId,
        status: 'success',
        latencyMs: result.latencyMs,
        requestId: result.requestId,
      });
    } catch (err) {
      const code = err?.code ?? 'UNKNOWN';
      setOnyxError({
        code,
        message: err?.message || 'Onyx is unreachable right now.',
        retryable: err?.retryable !== false,
      });
      trackAcademyEvent('AI_ASSISTANT_RESPONSE_FAILED', {
        lessonId,
        status: 'error',
        code,
        latencyMs: Date.now() - startedAt,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isTyping) return;

    // Capture the transcript before the new turn lands in the store.
    const history = aiChatHistory;
    setInput('');
    await askOnyx(question, history);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 border-l border-gray-800">
      <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500/20 rounded text-emerald-400">
            <SafeIcon name="Cpu" className="h-4 w-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-white">Onyx AI Tutor</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`w-1.5 h-1.5 rounded-full ${onyxError ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            {onyxError ? 'Degraded' : 'Synchronized'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {aiChatHistory.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-700">
              <SafeIcon name="MessageSquare" className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Neural Link Ready</p>
            <p className="text-xs text-gray-400 leading-relaxed px-6">
              Ask me anything about the technical specifications of "{courseTitle}" or network protocols.
            </p>
          </div>
        )}
        
        {aiChatHistory.map((msg) => (
          <motion.div 
            key={msg.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-lg ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {onyxError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[90%] p-4 rounded-2xl rounded-tl-none text-xs font-medium leading-relaxed bg-red-500/10 border border-red-500/30 text-red-300">
                <p className="font-bold uppercase tracking-widest text-[10px] mb-1">
                  Onyx uplink failed ({onyxError.code})
                </p>
                <p>{onyxError.message}</p>
                {onyxError.retryable && lastQuery && (
                  <button
                    onClick={() => askOnyx(lastQuery, aiChatHistory)}
                    className="mt-3 text-[10px] font-black uppercase tracking-widest text-red-200 underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-2xl rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-950/50 border-t border-gray-800">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query Onyx AI..." 
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none placeholder-gray-600"
          />
          <button 
            type="submit"
            disabled={isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-all disabled:opacity-50"
          >
            <SafeIcon name="Send" className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
