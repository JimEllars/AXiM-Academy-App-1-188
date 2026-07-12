import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function ExperienceToast() {
  const { notifications } = useAcademyStore();

  return (
    <div className="fixed bottom-24 right-8 z-[60] flex flex-col items-end space-y-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`px-4 py-3 rounded-xl border shadow-xl flex items-center space-x-3 backdrop-blur-md ${
              notif.type === 'level' 
                ? 'bg-emerald-600 border-emerald-400 text-white' 
                : 'bg-gray-900/90 border-gray-700 text-emerald-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${notif.type === 'level' ? 'bg-white/20' : 'bg-emerald-500/20'}`}>
              <SafeIcon name={notif.type === 'level' ? 'ArrowUp' : 'Zap'} className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{notif.title}</p>
              <p className="text-xs font-bold whitespace-nowrap">{notif.description}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}