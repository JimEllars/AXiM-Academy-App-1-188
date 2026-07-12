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

    const userMsg = input;
    addAiMessage({ role: 'user', content: userMsg });
    setInput('');
    setIsTyping(true);

    // Dynamic Mock Responses based on keywords
    setTimeout(() => {
      let response = `As an Onyx AI Architect, I've analyzed your query regarding "${courseTitle}". Based on the system schematics, the primary bottleneck you're describing is typical of Layer-2 congestion. I recommend reviewing the "Edge Network Overview" module for specific relay optimization parameters.`;
      
      if (userMsg.toLowerCase().includes('help')) {
        response = "I am standing by. To optimize your learning trajectory, specify the module or hardware component you are struggling with. I can provide real-time schematic explanations.";
      } else if (userMsg.toLowerCase().includes('sbt') || userMsg.toLowerCase().includes('certificate')) {
        response = "SBTs (Soulbound Tokens) are minted upon 100% curriculum completion. Once the ledger confirms your final quiz score, the minting protocol will initialize on the Arbitrum network.";
      }

      addAiMessage({ role: 'assistant', content: response });
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