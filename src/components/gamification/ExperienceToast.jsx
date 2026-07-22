import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '@/store/useAcademyStore';

export default function ExperienceToast() {
  const { notifications } = useAcademyStore();
  
  // Only show the most recent notification as a toast
  const activeToast = notifications[0];
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (activeToast) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (!activeToast) return null;

  const getStyle = (type) => {
    switch (type) {
      case 'level': return 'bg-purple-600 border-purple-400 text-white shadow-purple-500/20';
      case 'enrollment': return 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/20';
      case 'success': return 'bg-blue-600 border-blue-400 text-white shadow-blue-500/20';
      default: return 'bg-gray-900/95 border-gray-700 text-emerald-400 shadow-black/40';
    }
  };

  return (
    <div className="fixed bottom-24 right-8 z-[100] pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            role="status"
            aria-live="polite"
            key={activeToast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className={`px-6 py-4 rounded-2xl border shadow-2xl flex items-center space-x-4 backdrop-blur-xl ${getStyle(activeToast.type)}`}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className={`p-2.5 rounded-xl ${activeToast.type === 'level' || activeToast.type === 'enrollment' ? 'bg-white/20' : 'bg-emerald-500/20'}`}>
              <SafeIcon name={activeToast.icon || 'Zap'} className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 opacity-80">
                {activeToast.title}
              </p>
              <p className="text-sm font-bold tracking-tight whitespace-nowrap">
                {activeToast.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}