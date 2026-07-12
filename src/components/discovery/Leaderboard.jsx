import React from 'react';
import SafeIcon from '../../common/SafeIcon';

const LEADER_DATA = [
  { rank: 1, name: 'OxAlpha_Node', xp: 48200, certificates: 12, avatar: 'https://i.pravatar.cc/150?u=1' },
  { rank: 2, name: 'Z_Architect', xp: 42100, certificates: 9, avatar: 'https://i.pravatar.cc/150?u=2' },
  { rank: 3, name: 'Neural_Link', xp: 39500, certificates: 8, avatar: 'https://i.pravatar.cc/150?u=3' },
  { rank: 4, name: 'Cyber_Operator', xp: 31200, certificates: 7, avatar: 'https://i.pravatar.cc/150?u=4' },
  { rank: 5, name: 'Edge_Runner', xp: 28900, certificates: 6, avatar: 'https://i.pravatar.cc/150?u=5' }
];

export default function Leaderboard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between">
        <h3 className="text-white font-bold uppercase tracking-tight flex items-center space-x-2">
          <SafeIcon name="TrendingUp" className="h-4 w-4 text-emerald-500" />
          <span>Network Rankings</span>
        </h3>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Top 100</span>
      </div>
      <div className="divide-y divide-gray-800">
        {LEADER_DATA.map((leader) => (
          <div key={leader.rank} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors group">
            <div className="flex items-center space-x-4">
              <span className={`w-6 text-center font-black ${leader.rank <= 3 ? 'text-emerald-500' : 'text-gray-600'}`}>
                {leader.rank}
              </span>
              <div className="h-10 w-10 rounded-full border border-gray-800 overflow-hidden bg-gray-950">
                <img src={leader.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-200">{leader.name}</p>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{leader.certificates} Certs</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">{leader.xp.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">XP Points</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-gray-950 text-center border-t border-gray-800">
        <button className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
          View Full Ledger
        </button>
      </div>
    </div>
  );
}