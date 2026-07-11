import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function OnyxAssistant({ courseTitle }) {
  const { aiChatHistory, addAiMessage } = useAcademyStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiChatHistory, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    addAiMessage({ role: 'user', content: input });
    setInput('');
    setIsTyping(true);

    // Simulate Onyx AI Processing
    setTimeout(() => {
      addAiMessage({ 
        role: 'assistant', 
        content: `As an Onyx AI Architect, I've analyzed your query regarding "${courseTitle}". Based on the system schematics, the primary bottleneck you're describing is typical of Layer-2 congestion. I recommend reviewing the "Edge Network Overview" module for specific relay optimization parameters.`
      });
      setIsTyping(false);
    }, 1500);
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
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">Synchronized</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {aiChatHistory.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Neural Link Ready</p>
            <p className="text-sm text-gray-400">Ask me anything about the current curriculum or AXiM technical specs.</p>
          </div>
        )}
        {aiChatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
              ? 'bg-emerald-600 text-white rounded-tr-none' 
              : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-2xl rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
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
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400 p-1.5">
            <SafeIcon name="Send" className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}