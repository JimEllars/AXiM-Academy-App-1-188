import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export default function QuestTracker({ quests }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <SafeIcon name="Target" className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">
            Daily Objectives
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active</span>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {quests.map((quest) => (
          <div 
            key={quest.id} 
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              quest.completed 
                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                : 'bg-gray-950 border-gray-800/50 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className={`text-sm font-bold tracking-tight ${quest.completed ? 'text-emerald-400' : 'text-gray-200'}`}>
                  {quest.title}
                </h4>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{quest.description}</p>
              </div>
              <div className="bg-gray-900 px-2 py-1 rounded text-[10px] font-black text-emerald-500 border border-emerald-500/10">
                +{quest.rewardXp} XP
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(quest.current / quest.target) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${quest.completed ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-emerald-600/50'}`} 
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-gray-500">
                {quest.current}/{quest.target}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-gray-950/50 border-t border-gray-800 text-center">
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
          Objectives Refresh in 14:22:10
        </p>
      </div>
    </div>
  );
}