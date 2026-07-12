import React from 'react';
import HeroCatalog from '../components/discovery/HeroCatalog';
import CourseGrid from '../components/discovery/CourseGrid';
import Leaderboard from '../components/discovery/Leaderboard';
import SafeIcon from '../common/SafeIcon';

export default function Home() {
  return (
    <main className="bg-gray-950">
      <HeroCatalog />
      
      {/* Platform Stats Row */}
      <div className="border-y border-gray-800 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Active Operators', value: '14,281', icon: 'Users' },
            { label: 'Curriculums', value: '842', icon: 'Layers' },
            { label: 'SBTs Minted', value: '9,102', icon: 'Hexagon' },
            { label: 'Network Uptime', value: '99.9%', icon: 'Activity' }
          ].map((stat, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800">
                <SafeIcon name={stat.icon} className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12 py-12 px-4">
        <div className="lg:col-span-3">
          <CourseGrid />
        </div>
        <div className="lg:col-span-1 pt-16">
          <div className="sticky top-24 space-y-8">
            <div className="bg-emerald-600/10 border border-emerald-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <SafeIcon name="Cpu" className="h-20 w-20" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Architect Portal</h3>
              <p className="text-sm text-emerald-400/80 leading-relaxed mb-8">
                Do you possess proprietary technical knowledge? Apply to become an Architect and distribute your curricula across the AXiM ecosystem.
              </p>
              <button 
                onClick={() => window.location.hash = '#/partner-apply'}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-emerald-900/20"
              >
                Initiate Application
              </button>
            </div>
            
            <Leaderboard />
          </div>
        </div>
      </div>
    </main>
  );
}