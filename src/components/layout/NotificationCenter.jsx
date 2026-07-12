import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, clearNotifications } = useAcademyStore();

  const getIconColor = (type) => {
    switch (type) {
      case 'enrollment': return 'text-emerald-400 bg-emerald-500/10';
      case 'level': return 'text-purple-400 bg-purple-500/10';
      case 'xp': return 'text-amber-400 bg-amber-500/10';
      case 'success': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors bg-gray-900 border border-gray-800 rounded-xl"
      >
        <SafeIcon name="Bell" className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full border border-gray-950 animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Network Activity</h3>
                <button 
                  onClick={clearNotifications}
                  className="text-[10px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-tighter"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <SafeIcon name="Inbox" className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No Recent Transmissions</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 rounded-xl hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-800 group">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg shrink-0 ${getIconColor(notif.type)}`}>
                            <SafeIcon name={notif.icon || 'Zap'} className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-gray-100 group-hover:text-emerald-400 transition-colors">{notif.title}</h4>
                            <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{notif.description}</p>
                            <p className="text-[8px] text-gray-700 font-mono mt-2 uppercase">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-950 border-t border-gray-800 text-center">
                <button className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors">
                  View Full System Logs
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}