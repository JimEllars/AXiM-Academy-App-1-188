import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAcademyStore } from '../store/useAcademyStore';
import CredentialWallet from '../components/consumption/CredentialWallet';
import SafeIcon from '../common/SafeIcon';
import { GetStarted } from '@questlabs/react-sdk';
import { sdkTheme } from '../theme/sdkTheme';

export default function StudentDashboard() {
  const { user, walletAddress, enrollments, courses } = useAcademyStore();
  
  if (!user && !walletAddress) {
    return <Navigate to="/" replace />;
  }

  const activeEnrollments = enrollments.filter(e => e.status !== 'completed');
  const completedCount = enrollments.filter(e => e.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Command Center</h1>
          <p className="text-gray-500 font-medium">Operator: {user?.email || walletAddress?.slice(0, 8)}</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-gray-900 border border-gray-800 px-6 py-3 rounded-2xl">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">XP Points</p>
            <p className="text-xl font-bold text-white">{completedCount * 1250}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">SBT Status</p>
            <p className="text-xl font-bold text-emerald-400">{completedCount} Minted</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <SafeIcon name="Activity" className="h-5 w-5 text-emerald-500" />
              <span>Active Missions</span>
            </h2>
            
            {activeEnrollments.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
                <SafeIcon name="Zap" className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg mb-4">No active training modules detected.</p>
                <Link to="/" className="inline-block bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all">
                  Initialize Training
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {activeEnrollments.map(enr => {
                  const course = courses.find(c => c.id === enr.course_id);
                  const totalLessons = course?.modules.flatMap(m => m.lessons).length || 1;
                  const progressPercent = (enr.progress.length / totalLessons) * 100;
                  
                  return (
                    <div key={enr.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 hover:border-gray-700 transition-colors">
                      <img src={course?.thumbnail} className="h-24 w-24 rounded-2xl object-cover border border-gray-800" alt="" />
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-white">{course?.title}</h3>
                          <span className="text-xs font-mono text-emerald-400">{progressPercent.toFixed(0)}%</span>
                        </div>
                        <div className="bg-gray-950 rounded-full h-1.5 mb-6 border border-gray-800 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="bg-emerald-500 h-full" 
                          />
                        </div>
                        <div className="flex justify-end">
                          <Link to={`/learn/${course.id}`} className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl border border-gray-700 transition-all">
                            Resume Mission
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <SafeIcon name="Lock" className="h-5 w-5 text-emerald-500" />
              <span>Secure Credentials</span>
            </h2>
            <CredentialWallet />
          </section>
        </div>

        {/* Sidebar - SDK Integration */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center space-x-2">
              <SafeIcon name="Command" className="h-4 w-4 text-emerald-500" />
              <span>Operator Checklist</span>
            </h3>
            {/* Using mock for GetStarted SDK component UI representation */}
            <div className="space-y-4">
              {[
                { label: 'Connect Web3 Wallet', done: !!walletAddress },
                { label: 'Complete First Module', done: completedCount > 0 },
                { label: 'Mint Genesis SBT', done: false },
                { label: 'Join AXiM Discord', done: false }
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-gray-950 rounded-xl border border-gray-800">
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700'}`}>
                    {item.done && <SafeIcon name="Check" className="h-3 w-3" />}
                  </div>
                  <span className={`text-sm font-medium ${item.done ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Upgrade Access</h3>
            <p className="text-white/80 text-sm mb-6">Unlock the "System Architect" tier to access private hardware APIs.</p>
            <button className="w-full bg-white text-emerald-600 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all">
              View Elite Tiers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}