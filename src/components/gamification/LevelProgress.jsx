import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export default function LevelProgress({ level, xp }) {
  const currentLevelXp = (level - 1) * 1000;
  const nextLevelXp = level * 1000;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20">
            {level}
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Network Level</h4>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Operator Grade</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-white uppercase tracking-widest">{xp} <span className="text-gray-500">/ {nextLevelXp} XP</span></p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">{Math.round(nextLevelXp - xp)} XP to Rank Up</p>
        </div>
      </div>
      
      <div className="h-2 bg-gray-950 rounded-full border border-gray-800 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
        />
      </div>
      
      <div className="mt-4 flex justify-between">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Initiate</span>
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Architect</span>
      </div>
    </div>
  );
}