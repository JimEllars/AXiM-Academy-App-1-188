import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export default function BadgeNotification({ badge, onClose }) {
  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-8 right-8 z-[100] w-80"
      >
        <div className="bg-gray-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-2xl shadow-emerald-500/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
              <SafeIcon name={badge.icon} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Achievement Unlocked</p>
              <h3 className="text-white font-bold">{badge.name}</h3>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">{badge.description}</p>
          <button 
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}