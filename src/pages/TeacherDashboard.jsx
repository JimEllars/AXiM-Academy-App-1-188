import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAcademyStore } from '../store/useAcademyStore';
import SafeIcon from '../common/SafeIcon';
import CourseBuilder from '../components/admin/CourseBuilder';
import Gradebook from '../components/admin/Gradebook';
import PromoManager from '../components/admin/PromoManager';
import FinancialsPanel from '../components/admin/FinancialsPanel';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';
import CommsHub from '../components/admin/CommsHub';

export default function TeacherDashboard() {
  const { courses, enrollments, partners, user, getPartnerStats, studentQueries } = useAcademyStore();
  const [view, setView] = useState('overview');
  const [editingCourse, setEditingCourse] = useState(null);
  
  const partner = partners.find(p => p.user_id === user?.id);
  const isPartner = !!partner;
  const stats = getPartnerStats(partner?.id);
  const pendingQueries = studentQueries.filter(q => q.status === 'pending').length;

  if (view === 'builder') return (
    <CourseBuilder 
      initialCourse={editingCourse} 
      onSave={(d) => {
        const courseData = { 
          ...d, 
          id: editingCourse?.id || `c-${Date.now()}`,
          instructor_id: partner?.id,
          revenue_share: partner?.revenue_share || 70,
          is_approved: editingCourse ? editingCourse.is_approved : false
        };
        useAcademyStore.getState().addCourse(courseData);
        setView('overview');
      }} 
      onCancel={() => setView('overview')} 
    />
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Architect Portal</h1>
          <div className="flex items-center space-x-3">
            <p className="text-gray-500 font-medium">Global Operations Control</p>
            {isPartner && (
              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                Verified Architect
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: 'Grid' },
            { id: 'analytics', label: 'Analytics', icon: 'Activity' },
            { id: 'comms', label: 'Comms', icon: 'MessageSquare', badge: pendingQueries },
            { id: 'financials', label: 'Financials', icon: 'DollarSign' },
            { id: 'gradebook', label: 'Ledger', icon: 'Book' },
            { id: 'promos', label: 'Promo Hub', icon: 'Zap' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border shrink-0 relative ${
                view === tab.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              <SafeIcon name={tab.icon} className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center border-2 border-gray-950">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
          <button onClick={() => { setEditingCourse(null); setView('builder'); }}
            className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shrink-0"
          >
            + Architect
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'analytics' ? (
            <AnalyticsPanel stats={stats} />
          ) : view === 'comms' ? (
            <CommsHub />
          ) : view === 'financials' ? (
            <FinancialsPanel partnerId={partner?.id} />
          ) : view === 'gradebook' ? (
            <Gradebook enrollments={enrollments} courses={courses} />
          ) : view === 'promos' ? (
            <PromoManager />
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'Ecosystem Reach', value: stats.totalStudents, trend: '+18%', icon: 'Globe' },
                  { label: 'Active Sessions', value: '42', trend: 'Live Now', icon: 'Radio' },
                  { label: 'Avg Completion', value: `${Math.round(stats.completionRate)}%`, trend: '+2.1%', icon: 'Activity' }
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl relative overflow-hidden group">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="text-3xl font-black text-white">{stat.value}</p>
                    <span className="text-emerald-500 text-[10px] font-bold mt-2 block">{stat.trend}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-6">
                {courses.filter(c => c.instructor_id === partner?.id).map(course => (
                  <div key={course.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 group hover:border-emerald-500/30 transition-all">
                    <div className="h-32 w-full md:w-56 shrink-0 overflow-hidden rounded-2xl border border-gray-800">
                      <img src={course.thumbnail} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">{course.title}</h3>
                        {!course.is_approved && (
                          <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 text-[8px] font-black uppercase tracking-widest">
                            Awaiting Council Approval
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">{course.category}</span>
                        <span className="text-xs text-gray-500 font-bold uppercase">{course.modules.length} Modules</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                      <button onClick={() => { setEditingCourse(course); setView('builder'); }}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-700"
                      >
                        Modify Specs
                      </button>
                      <button className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        View Live Stats
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}