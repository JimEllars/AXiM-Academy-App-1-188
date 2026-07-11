import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAcademyStore } from '../store/useAcademyStore';
import SafeIcon from '../common/SafeIcon';
import CourseBuilder from '../components/admin/CourseBuilder';
import LiveControlPanel from '../components/admin/LiveControlPanel';
import Gradebook from '../components/admin/Gradebook';

export default function TeacherDashboard() {
  const { courses, enrollments, addCourse, updateCourse } = useAcademyStore();
  const [view, setView] = useState('overview'); // 'overview' | 'builder' | 'live' | 'gradebook'
  const [editingCourse, setEditingCourse] = useState(null);
  const [activeLiveLesson, setActiveLiveLesson] = useState(null);

  const handleCreateNew = () => {
    setEditingCourse(null);
    setView('builder');
  };

  const openLiveControl = (course) => {
    const liveLesson = course.modules.flatMap(m => m.lessons).find(l => l.type === 'live');
    if (liveLesson) {
      setActiveLiveLesson(liveLesson);
      setView('live');
    }
  };

  if (view === 'builder') return <CourseBuilder initialCourse={editingCourse} onSave={(d) => { if(editingCourse) updateCourse(editingCourse.id, d); else addCourse({...d, id: `c-${Date.now()}`}); setView('overview'); }} onCancel={() => setView('overview')} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Instructor Command</h1>
          <p className="text-gray-500 font-medium">Operations Hub for Onyx AI Senior Architects</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setView(view === 'gradebook' ? 'overview' : 'gradebook')} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-gray-800 flex items-center space-x-2">
            <SafeIcon name={view === 'gradebook' ? 'Grid' : 'Book'} className="h-4 w-4" />
            <span>{view === 'gradebook' ? 'Deployments' : 'Performance Ledger'}</span>
          </button>
          <button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-emerald-900/20 flex items-center space-x-2">
            <SafeIcon name="Plus" className="h-4 w-4" />
            <span>Architect Curriculum</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'gradebook' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Gradebook enrollments={enrollments} courses={courses} />
          </motion.div>
        ) : view === 'live' ? (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => setView('overview')} className="mb-8 text-gray-500 hover:text-white flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
                <SafeIcon name="ArrowLeft" className="h-4 w-4" />
                <span>Return to Command</span>
              </button>
              <LiveControlPanel lesson={activeLiveLesson} onToggleLive={() => {}} />
           </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Network Reach', value: '12,482', trend: '+18%', icon: 'Globe' },
                { label: 'Active Sessions', value: '42', trend: 'Live Now', icon: 'Radio' },
                { label: 'Avg Completion', value: '74%', trend: '+2.1%', icon: 'Activity' }
              ].map((stat, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl relative overflow-hidden group">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <span className="text-emerald-500 text-[10px] font-bold mt-2 block">{stat.trend}</span>
                </div>
              ))}
            </div>

            <div className="grid gap-6">
              {courses.map(course => (
                <div key={course.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex items-center gap-8 group hover:border-emerald-500/30 transition-all">
                  <div className="h-32 w-56 shrink-0 overflow-hidden rounded-2xl border border-gray-800">
                    <img src={course.thumbnail} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">{course.category}</span>
                      <span className="text-xs text-gray-500 font-bold uppercase">{course.modules.length} Modules</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { setEditingCourse(course); setView('builder'); }} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-700">Modify Specs</button>
                    <button onClick={() => openLiveControl(course)} className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Go Live</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}