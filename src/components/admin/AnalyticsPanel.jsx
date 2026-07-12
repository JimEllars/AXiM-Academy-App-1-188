import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export default function AnalyticsPanel({ stats }) {
  const chartData = [45, 52, 48, 70, 65, 80, 95]; // Mock engagement data

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Learners', value: stats.totalStudents, trend: '+12%', color: 'text-blue-400' },
          { label: 'Completion Rate', value: `${Math.round(stats.completionRate)}%`, trend: '+5.4%', color: 'text-emerald-400' },
          { label: 'Avg Study Time', value: '2.4h', trend: '-2%', color: 'text-amber-400' },
          { label: 'Net Earnings', value: `$${stats.grossRevenue.toFixed(0)}`, trend: '+22%', color: 'text-purple-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className={`text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold uppercase tracking-tight">Engagement Velocity</h3>
            <div className="flex space-x-2">
              <span className="bg-gray-800 px-3 py-1 rounded-lg text-[10px] text-gray-400 font-bold">7 DAYS</span>
            </div>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {chartData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  className="w-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-all rounded-t-lg relative"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}%
                  </div>
                </motion.div>
                <span className="text-[8px] font-black text-gray-600 uppercase">Day {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8">
          <h3 className="text-white font-bold uppercase tracking-tight mb-6">Device Distribution</h3>
          <div className="space-y-6">
            {[
              { label: 'Desktop / Workstation', val: 68, color: 'bg-blue-500' },
              { label: 'Mobile / Edge', val: 24, color: 'bg-emerald-500' },
              { label: 'Neural Link', val: 8, color: 'bg-purple-500' }
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white">{item.val}%</span>
                </div>
                <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    className={`h-full ${item.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}