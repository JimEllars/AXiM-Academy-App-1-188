import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function TrophyCase() {
  const { unlockedBadges, courses } = useAcademyStore();
  
  // All possible badges from courses
  const allBadges = courses.filter(c => c.badge).map(c => c.badge);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {allBadges.map((badge) => {
        const isUnlocked = unlockedBadges.some(b => b.id === badge.id);
        
        return (
          <motion.div 
            key={badge.id}
            whileHover={isUnlocked ? { y: -5 } : {}}
            className={`relative p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
              isUnlocked 
              ? 'bg-gray-900 border-emerald-500/30 shadow-lg shadow-emerald-500/5' 
              : 'bg-gray-900/40 border-gray-800 opacity-40 grayscale'
            }`}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
              isUnlocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-600'
            }`}>
              <SafeIcon name={badge.icon} className="h-6 w-6" />
            </div>
            <h4 className={`text-[10px] font-black uppercase tracking-tighter line-clamp-1 ${
              isUnlocked ? 'text-white' : 'text-gray-500'
            }`}>
              {badge.name}
            </h4>
            
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-950/20 backdrop-blur-[1px] rounded-2xl">
                <SafeIcon name="Lock" className="h-4 w-4 text-gray-700" />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}