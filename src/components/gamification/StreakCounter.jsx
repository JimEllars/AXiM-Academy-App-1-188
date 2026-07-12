import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export default function StreakCounter({ days }) {
  return (
    <div className="flex items-center space-x-3 bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl relative group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`p-2 rounded-lg ${days > 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-gray-800 text-gray-500'}`}>
        <SafeIcon name="Zap" className={`h-5 w-5 ${days > 0 ? 'animate-pulse' : ''}`} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Learning Streak</p>
        <div className="flex items-baseline space-x-1">
          <span className="text-xl font-black text-white">{days}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Days</span>
        </div>
      </div>
      {days > 0 && (
        <div className="ml-auto flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-1 h-3 rounded-full ${i < days ? 'bg-orange-500' : 'bg-gray-800'}`} />
          ))}
        </div>
      )}
    </div>
  );
}