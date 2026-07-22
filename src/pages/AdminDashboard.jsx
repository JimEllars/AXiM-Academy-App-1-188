import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAcademyStore } from '../store/useAcademyStore';
import SafeIcon from '../common/SafeIcon';
import { trackAcademyEvent } from '../lib/utils';

export default function AdminDashboard() {
  const { partnerApplications, approvePartner, courses, approveCourse, role } = useAcademyStore();
  
  const pendingApps = partnerApplications.filter(a => a.status === 'pending');
  const pendingCourses = courses.filter(c => !c.is_approved);

  useEffect(() => {
    trackAcademyEvent('ADMIN_DASHBOARD_VIEWED', { role });
  }, [role]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="mb-16">
        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Council Chamber</h1>
        <p className="text-gray-500 font-medium">AXiM Central Governance & Verification Hub</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Partner Approvals */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center space-x-3">
              <SafeIcon name="Users" className="h-5 w-5 text-emerald-500" />
              <span>Partner Requests</span>
            </h2>
            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
              {pendingApps.length} Pending
            </span>
          </div>

          <div className="space-y-4">
            {pendingApps.length > 0 ? pendingApps.map(app => (
              <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{app.name}</h3>
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{app.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Revenue Request</p>
                    <p className="text-white font-bold">{app.revenue_expectation}%</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">{app.bio}</p>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => approvePartner(app.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Approve Architect
                  </button>
                  <button className="px-6 py-3 bg-gray-800 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-700">
                    Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="bg-gray-900/50 border border-dashed border-gray-800 p-12 text-center rounded-3xl">
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Queue Empty</p>
              </div>
            )}
          </div>
        </section>

        {/* Course Approvals */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center space-x-3">
              <SafeIcon name="Layers" className="h-5 w-5 text-blue-500" />
              <span>Curriculum Verification</span>
            </h2>
            <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
              {pendingCourses.length} Pending
            </span>
          </div>

          <div className="space-y-4">
            {pendingCourses.length > 0 ? pendingCourses.map(course => (
              <div key={course.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all">
                <div className="flex items-center space-x-4 mb-4">
                  <img src={course.thumbnail} className="h-16 w-16 rounded-xl object-cover border border-gray-800" alt="" />
                  <div>
                    <h3 className="text-white font-bold">{course.title}</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">${course.price_usd} USD</p>
                  </div>
                </div>
                <button 
                  onClick={() => approveCourse(course.id)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                >
                  Authorize Deployment
                </button>
              </div>
            )) : (
              <div className="bg-gray-900/50 border border-dashed border-gray-800 p-12 text-center rounded-3xl">
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">No Pendings Curriculums</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}