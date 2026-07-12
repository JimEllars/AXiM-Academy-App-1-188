import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function GlobalSearch() {
  const { isSearchOpen, setSearchOpen, courses } = useAcademyStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  const results = query 
    ? courses.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : courses.slice(0, 3);

  const handleSelect = (courseId) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/course/${courseId}`);
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-[2rem] shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-6 border-b border-gray-800 flex items-center space-x-4">
              <SafeIcon name="Search" className="h-6 w-6 text-emerald-500" />
              <input 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search curricula, architects, or systems..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xl text-white placeholder-gray-600 font-bold"
              />
              <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 bg-gray-800 rounded-lg text-[10px] text-gray-400 font-black border border-gray-700">
                <span>ESC</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-3">
                {query ? 'Transmission Matches' : 'Recent Curricula'}
              </div>
              
              <div className="space-y-2">
                {results.map(course => (
                  <button
                    key={course.id}
                    onClick={() => handleSelect(course.id)}
                    className="w-full p-4 rounded-2xl bg-gray-950/50 border border-gray-800 hover:border-emerald-500/50 hover:bg-gray-800/50 transition-all text-left flex items-center space-x-4 group"
                  >
                    <img src={course.thumbnail} className="h-12 w-12 rounded-xl object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all" alt="" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{course.title}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{course.category} • {course.difficulty}</p>
                    </div>
                    <SafeIcon name="ArrowRight" className="h-4 w-4 text-gray-700 group-hover:text-emerald-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-[8px] font-black text-gray-600 uppercase tracking-widest">
                  <SafeIcon name="CornerDownLeft" className="h-3 w-3" />
                  <span>Select</span>
                </div>
                <div className="flex items-center space-x-2 text-[8px] font-black text-gray-600 uppercase tracking-widest">
                  <SafeIcon name="ArrowUp" className="h-3 w-3" />
                  <SafeIcon name="ArrowDown" className="h-3 w-3" />
                  <span>Navigate</span>
                </div>
              </div>
              <p className="text-[8px] font-black text-emerald-500/50 uppercase tracking-[0.3em]">AXiM Neural Search v4.2</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}