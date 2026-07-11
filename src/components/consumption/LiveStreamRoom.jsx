import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function LiveStreamRoom({ lesson, onComplete }) {
  const { user, walletAddress } = useAcademyStore();
  const [messages, setMessages] = useState([
    { id: 1, user: 'System', text: 'Welcome to the Live Session. Awaiting Instructor...', type: 'system' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLive, setIsLive] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      user: user?.email?.split('@')[0] || walletAddress?.slice(0, 6) || 'Guest',
      text: inputValue,
      type: 'user'
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Mock instructor response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        user: 'Instructor',
        text: 'Excellent question! We will address hardware pooling in the next segment.',
        type: 'instructor'
      }]);
    }, 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Stream Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative aspect-video bg-black border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Mock Livestream Overlay */}
          <div className="absolute top-6 left-6 z-10 flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-[10px] font-bold">
              1,248 OPERATORS
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <SafeIcon name="Video" className="h-10 w-10 text-emerald-500" />
              </div>
              <p className="text-white font-black uppercase tracking-widest">Establishing Secure Uplink...</p>
            </div>
          </div>

          {/* Actual Video (Mocked) */}
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
             <img 
               src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80" 
               className="w-full h-full object-cover opacity-40 blur-sm" 
               alt="Stream Preview"
             />
          </div>
        </div>

        <div className="mt-6 p-6 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{lesson.title}</h2>
            <p className="text-emerald-500 text-xs font-bold mt-1">Instructor: {lesson.instructor}</p>
          </div>
          <button 
            onClick={onComplete}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all border border-gray-700"
          >
            Leave Session
          </button>
        </div>
      </div>

      {/* Live Interaction Sidebar */}
      <div className="w-full lg:w-96 flex flex-col bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm uppercase tracking-tighter">Secure Comms</h3>
          <div className="flex space-x-2">
            <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
              <SafeIcon name="Settings" className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        >
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-tighter ${
                  msg.type === 'instructor' ? 'text-emerald-400' : 
                  msg.type === 'system' ? 'text-blue-400' : 'text-gray-500'
                }`}>
                  {msg.user}
                </span>
              </div>
              <div className={`p-3 rounded-2xl text-sm ${
                msg.type === 'instructor' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100' : 
                msg.type === 'system' ? 'bg-blue-500/10 text-blue-100 italic' : 'bg-gray-950 text-gray-300'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-950 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Transmit message..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-emerald-500 outline-none pr-12"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
            >
              <SafeIcon name="Send" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}