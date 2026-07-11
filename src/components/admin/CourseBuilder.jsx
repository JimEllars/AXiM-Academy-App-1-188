import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function CourseBuilder({ initialCourse, onSave, onCancel }) {
  const [course, setCourse] = useState(initialCourse || {
    title: '',
    category: 'Hardware',
    difficulty: 'Beginner',
    price_usd: 0,
    description: '',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    modules: []
  });

  const [activeTab, setActiveTab] = useState('settings');

  const addModule = () => {
    const newModule = {
      id: `mod-${Date.now()}`,
      title: 'Untitled Module',
      lessons: []
    };
    setCourse({ ...course, modules: [...course.modules, newModule] });
  };

  const addLesson = (moduleId) => {
    const newLesson = {
      id: `les-${Date.now()}`,
      title: 'New Lesson',
      type: 'video',
      duration: '10m'
    };
    const updatedModules = course.modules.map(m => 
      m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
    );
    setCourse({ ...course, modules: updatedModules });
  };

  return (
    <div className="bg-gray-950 min-h-screen pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
              {initialCourse ? 'Edit Curriculum' : 'Architect New Course'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Design professional learning paths for the AXiM ecosystem.</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={onCancel} className="px-6 py-2.5 rounded-xl border border-gray-800 text-gray-400 font-bold hover:bg-gray-900 transition-all">
              Discard
            </button>
            <button 
              onClick={() => onSave(course)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20"
            >
              Deploy Curriculum
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation */}
          <div className="space-y-2">
            {[
              { id: 'settings', label: 'Global Specs', icon: 'Settings' },
              { id: 'curriculum', label: 'Module Array', icon: 'Layers' },
              { id: 'pricing', label: 'Economic Model', icon: 'DollarSign' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500 hover:bg-gray-900'
                }`}
              >
                <SafeIcon name={tab.icon} className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Curriculum Title</label>
                      <input 
                        type="text" 
                        value={course.title}
                        onChange={(e) => setCourse({...course, title: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                        placeholder="e.g. Advanced AI Logic Integration"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Domain</label>
                        <select 
                           value={course.category}
                           onChange={(e) => setCourse({...course, category: e.target.value})}
                           className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none"
                        >
                          <option>Hardware</option>
                          <option>Finance</option>
                          <option>AI</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Complexity</label>
                        <select 
                           value={course.difficulty}
                           onChange={(e) => setCourse({...course, difficulty: e.target.value})}
                           className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                          <option>Expert</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mission Executive Summary</label>
                      <textarea 
                        rows="4"
                        value={course.description}
                        onChange={(e) => setCourse({...course, description: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                        placeholder="Define the primary objectives of this curriculum..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'curriculum' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  {course.modules.map((mod, modIdx) => (
                    <div key={mod.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                      <div className="p-4 bg-gray-950 flex justify-between items-center border-b border-gray-800">
                        <input 
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const newModules = [...course.modules];
                            newModules[modIdx].title = e.target.value;
                            setCourse({...course, modules: newModules});
                          }}
                          className="bg-transparent font-bold text-white border-none focus:ring-0 w-1/2"
                        />
                        <button onClick={() => addLesson(mod.id)} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center space-x-1 hover:text-emerald-400">
                          <SafeIcon name="Plus" className="h-3 w-3" />
                          <span>Add Lesson</span>
                        </button>
                      </div>
                      <div className="p-4 space-y-2">
                        {mod.lessons.map((lesson, lesIdx) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl group">
                            <div className="flex items-center space-x-3">
                              <SafeIcon name={lesson.type === 'video' ? 'Play' : 'FileText'} className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-300">{lesson.title}</span>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500">
                                <SafeIcon name="Edit" className="h-3.5 w-3.5" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-800 rounded-lg text-red-500">
                                <SafeIcon name="Trash2" className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={addModule}
                    className="w-full py-4 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 font-bold text-sm uppercase tracking-widest hover:border-emerald-500/50 hover:text-emerald-500 transition-all"
                  >
                    + Append New Module
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}