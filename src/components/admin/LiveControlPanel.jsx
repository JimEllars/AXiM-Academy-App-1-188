import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export default function LiveControlPanel({ lesson, onToggleLive }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState({
    viewers: 1248,
    uptime: '00:42:15',
    latency: '24ms'
  });

  const handleToggle = () => {
    setIsStreaming(!isStreaming);
    onToggleLive(!isStreaming);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Live Broadcast Hub</h2>
          <p className="text-gray-500 text-sm mt-1">Session: {lesson.title}</p>
        </div>
        <button 
          onClick={handleToggle}
          className={`flex items-center space-x-3 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${
            isStreaming 
            ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20' 
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
          }`}
        >
          <div className={`w-2 h-2 rounded-full bg-white ${isStreaming ? 'animate-pulse' : ''}`} />
          <span>{isStreaming ? 'Terminate Broadcast' : 'Initiate Uplink'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Active Operators', value: stats.viewers, icon: 'Users', color: 'text-blue-400' },
          { label: 'Stream Uptime', value: stats.uptime, icon: 'Clock', color: 'text-emerald-400' },
          { label: 'Network Latency', value: stats.latency, icon: 'Zap', color: 'text-amber-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-gray-950 border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center space-x-3 mb-2">
              <SafeIcon name={stat.icon} className={`h-4 w-4 ${stat.color}`} />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center space-x-2">
            <SafeIcon name="MessageSquare" className="h-4 w-4 text-emerald-500" />
            <span>Top Questions</span>
          </h3>
          <div className="space-y-4">
            {[
              { user: 'Alpha_77', text: 'How do we handle relay congestion?', votes: 42 },
              { user: 'Z_Link', text: 'Can we use Arbiscan to verify nodes?', votes: 28 },
              { user: 'Dev_X', text: 'What is the minimum staking requirement?', votes: 15 }
            ].map((q, i) => (
              <div key={i} className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">@{q.user}</p>
                  <p className="text-sm text-gray-300">{q.text}</p>
                </div>
                <div className="flex flex-col items-center">
                  <SafeIcon name="ChevronUp" className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold text-white">{q.votes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center space-x-2">
            <SafeIcon name="Activity" className="h-4 w-4 text-emerald-500" />
            <span>Health Monitor</span>
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-gray-500">Audio Bitrate</span>
                <span className="text-emerald-400">Stable</span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-gray-500">Video (4K/60fps)</span>
                <span className="text-emerald-400">Optimal</span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[94%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-gray-500">Frame Drops</span>
                <span className="text-gray-400">0.02%</span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[2%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}