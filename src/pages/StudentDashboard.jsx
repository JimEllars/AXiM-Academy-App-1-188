import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAcademyStore } from '../store/useAcademyStore';
import CredentialWallet from '../components/consumption/CredentialWallet';
import TrophyCase from '../components/gamification/TrophyCase';
import SafeIcon from '../common/SafeIcon';

export default function StudentDashboard() {
  const { user, walletAddress, enrollments, courses, unlockedBadges } = useAcademyStore();
  
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
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Badges</p>
            <p className="text-xl font-bold text-white">{unlockedBadges.length}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">XP Points</p>
            <p className="text-xl font-bold text-emerald-400">{completedCount * 1250}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Active Missions */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <SafeIcon name="Activity" className="h-5 w-5 text-emerald-500" />
              <span>Active Missions</span>
            </h2>
            {/* ... Mission List ... */}
            <div className="grid gap-6">
              {activeEnrollments.map(enr => {
                const course = courses.find(c => c.id === enr.course_id);
                const totalLessons = course?.modules.flatMap(m => m.lessons).length || 1;
                const progressPercent = (enr.progress.length / totalLessons) * 100;
                return (
                  <div key={enr.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex items-center gap-6">
                    <img src={course?.thumbnail} className="h-20 w-20 rounded-2xl object-cover border border-gray-800" alt="" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{course?.title}</h3>
                      <div className="bg-gray-950 rounded-full h-1.5 mb-4 border border-gray-800 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="bg-emerald-500 h-full" />
                      </div>
                      <Link to={`/learn/${course.id}`} className="text-emerald-400 text-sm font-bold uppercase tracking-widest hover:text-emerald-300 transition-colors">
                        Resume Training
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Trophy Case Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <SafeIcon name="Award" className="h-5 w-5 text-emerald-500" />
                <span>Achievement Vault</span>
              </h2>
              <span className="text-xs text-gray-500 font-bold uppercase">{unlockedBadges.length} Unlocked</span>
            </div>
            <TrophyCase />
          </section>

          {/* Secure Credentials */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <SafeIcon name="Lock" className="h-5 w-5 text-emerald-500" />
              <span>Secure Credentials</span>
            </h2>
            <CredentialWallet />
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center space-x-2">
              <SafeIcon name="Command" className="h-4 w-4 text-emerald-500" />
              <span>Operator Checklist</span>
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Connect Web3 Wallet', done: !!walletAddress },
                { label: 'Earn First Badge', done: unlockedBadges.length > 0 },
                { label: 'Mint Genesis SBT', done: false }
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
        </div>
      </div>
    </div>
  );
}