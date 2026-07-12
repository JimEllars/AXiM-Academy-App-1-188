import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export default function QuestTracker({ quests }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
      <div className="p-5 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between">
        <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center space-x-2">
          <SafeIcon name="Target" className="h-4 w-4 text-emerald-500" />
          <span>Daily Objectives</span>
        </h3>
        <span className="text-[10px] font-bold text-gray-500 uppercase">Resets in 14h</span>
      </div>
      <div className="p-4 space-y-3">
        {quests.map((quest) => (
          <div key={quest.id} className={`p-4 rounded-2xl border transition-all ${quest.completed ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-gray-950 border-gray-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className={`text-sm font-bold ${quest.completed ? 'text-emerald-400' : 'text-gray-200'}`}>
                  {quest.title}
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">{quest.description}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-emerald-500">+{quest.rewardXp} XP</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${quest.completed ? 'bg-emerald-500' : 'bg-gray-700'}`} 
                  style={{ width: `${(quest.current / quest.target) * 100}%` }} 
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500">{quest.current}/{quest.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}