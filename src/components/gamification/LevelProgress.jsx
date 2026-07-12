import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export default function LevelProgress({ level, xp }) {
  const currentLevelXp = (level - 1) * 1000;
  const nextLevelXp = level * 1000;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 relative z-10">
        <div className="flex items-center space-x-5">
          <div className="relative">
            <div className="h-16 w-16 bg-emerald-500 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] rotate-3 group-hover:rotate-0 transition-transform duration-500">
              {level}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gray-950 border border-gray-800 px-2 py-0.5 rounded text-[8px] font-black text-emerald-500 uppercase tracking-widest">
              LVL
            </div>
          </div>
          <div>
            <h4 className="text-xl font-black text-white uppercase tracking-tighter">Network Operator</h4>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1">Grade {level} Architect</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-black text-white uppercase tracking-widest">
            {xp.toLocaleString()} <span className="text-gray-600 text-sm">/ {nextLevelXp.toLocaleString()} XP</span>
          </p>
          <div className="flex items-center justify-end space-x-2 mt-1">
            <SafeIcon name="TrendingUp" className="h-3 w-3 text-emerald-500" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {Math.round(nextLevelXp - xp)} XP to Rank Up
            </p>
          </div>
        </div>
      </div>
      
      <div className="relative h-3 bg-gray-950 rounded-full border border-gray-800/50 p-[2px] overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 rounded-full relative"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]" />
        </motion.div>
      </div>
      
      <div className="mt-5 flex justify-between items-center text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
        <div className="flex items-center space-x-2">
          <span>Current Tier</span>
          <div className="h-px w-8 bg-gray-800" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-px w-8 bg-gray-800" />
          <span className="text-emerald-500/50">Next Milestone</span>
        </div>
      </div>
    </div>
  );
}