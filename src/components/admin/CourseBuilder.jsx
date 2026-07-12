import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import CurriculumEditor from './CurriculumEditor';

export default function CourseBuilder({ initialCourse, onSave, onCancel }) {
  const [course, setCourse] = useState(initialCourse || {
    title: '',
    category: 'Hardware',
    difficulty: 'Beginner',
    price_usd: 199,
    price_crypto: '0.05',
    description: '',
    long_description: '',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    modules: []
  });

  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="bg-gray-950 min-h-screen pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-6">
            <button onClick={onCancel} className="p-3 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 hover:text-white transition-colors">
              <SafeIcon name="ArrowLeft" className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                {initialCourse ? 'Update Specs' : 'Architect Curriculum'}
              </h1>
              <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-widest">Protocol Version 4.2.0</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={onCancel} className="px-8 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-800 transition-all">
              Discard
            </button>
            <button 
              onClick={() => onSave(course)}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-900/20 flex items-center space-x-2"
            >
              <SafeIcon name="Zap" className="h-4 w-4" />
              <span>Deploy to Network</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1 space-y-2">
            {[
              { id: 'settings', label: 'Global Variables', icon: 'Settings' },
              { id: 'curriculum', label: 'Module Array', icon: 'Layers' },
              { id: 'pricing', label: 'Economic Model', icon: 'DollarSign' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <SafeIcon name={tab.icon} className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
                {activeTab === tab.id && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Curriculum Title</label>
                      <input 
                        value={course.title}
                        onChange={(e) => setCourse({ ...course, title: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="e.g. Layer-2 Hardware Relay Deployment"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Domain Classification</label>
                        <select 
                          value={course.category}
                          onChange={(e) => setCourse({ ...course, category: e.target.value })}
                          className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        >
                          <option>Hardware</option><option>AI</option><option>Finance</option><option>Protocol</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Difficulty Tier</label>
                        <select 
                          value={course.difficulty}
                          onChange={(e) => setCourse({ ...course, difficulty: e.target.value })}
                          className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        >
                          <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Architect</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Brief Abstract</label>
                      <textarea 
                        rows="4"
                        value={course.description}
                        onChange={(e) => setCourse({ ...course, description: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                        placeholder="Define the curriculum objectives in 280 characters..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'curriculum' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <CurriculumEditor 
                    modules={course.modules} 
                    setModules={(mods) => setCourse({ ...course, modules: mods })} 
                  />
                </motion.div>
              )}

              {activeTab === 'pricing' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 space-y-10 shadow-2xl">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-gray-950 border border-gray-800 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <SafeIcon name="DollarSign" className="h-16 w-16" />
                        </div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Legacy Price (USD)</label>
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl font-black text-white">$</span>
                          <input 
                            type="number"
                            value={course.price_usd}
                            onChange={(e) => setCourse({ ...course, price_usd: e.target.value })}
                            className="bg-transparent border-none focus:ring-0 text-3xl font-black text-white p-0 w-full"
                          />
                        </div>
                      </div>
                      <div className="bg-gray-950 border border-gray-800 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <SafeIcon name="Zap" className="h-16 w-16" />
                        </div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">On-Chain Price (ETH)</label>
                        <div className="flex items-center space-x-3">
                          <input 
                            type="text"
                            value={course.price_crypto}
                            onChange={(e) => setCourse({ ...course, price_crypto: e.target.value })}
                            className="bg-transparent border-none focus:ring-0 text-3xl font-black text-emerald-400 p-0 w-full"
                          />
                          <span className="text-xl font-bold text-gray-600">ETH</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start space-x-4">
                      <SafeIcon name="Info" className="h-5 w-5 text-emerald-500 mt-0.5" />
                      <p className="text-xs text-emerald-400/80 leading-relaxed">
                        Economic Policy: A 25% platform maintenance fee is applied to all network transactions. Instructors receive 75% of gross revenue via automated smart contract routing.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}