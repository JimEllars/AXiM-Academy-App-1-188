import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function CommsHub() {
  const { studentQueries, resolveQuery } = useAcademyStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-4">Filters</h3>
          <div className="space-y-2">
            {['All Messages', 'Pending', 'Archived'].map((f, i) => (
              <button key={i} className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-2xl">
          <div className="flex items-center space-x-3 mb-3">
            <SafeIcon name="Cpu" className="h-5 w-5 text-emerald-500" />
            <h4 className="text-white font-bold text-xs uppercase tracking-tight">Onyx Insight</h4>
          </div>
          <p className="text-[10px] text-emerald-400/80 font-medium leading-relaxed">
            AI has pre-answered 14 basic queries today, saving you approximately 42 minutes of operational time.
          </p>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-4">
        {studentQueries.map((q) => (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-gray-900 border rounded-[2rem] p-8 transition-all ${q.status === 'pending' ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'border-gray-800 opacity-60'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-950 border border-gray-800 rounded-full flex items-center justify-center text-emerald-500 font-black text-xs">
                  {q.student[0]}
                </div>
                <div>
                  <h4 className="text-white font-bold">{q.student}</h4>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{q.course}</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-600 font-mono">{new Date(q.timestamp).toLocaleTimeString()}</span>
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed mb-8">"{q.text}"</p>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => resolveQuery(q.id)}
                disabled={q.status === 'answered'}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${q.status === 'pending' ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                {q.status === 'pending' ? 'Respond via Uplink' : 'Resolved'}
              </button>
              <button className="px-6 py-3 bg-gray-950 text-gray-500 border border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}