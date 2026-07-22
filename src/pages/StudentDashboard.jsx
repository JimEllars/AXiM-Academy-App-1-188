import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAcademyStore } from '../store/useAcademyStore';
import { trackAcademyEvent } from '../lib/utils';
import CredentialWallet from '../components/consumption/CredentialWallet';
import TrophyCase from '../components/gamification/TrophyCase';
import Leaderboard from '../components/discovery/Leaderboard';
import StreakCounter from '../components/gamification/StreakCounter';
import LevelProgress from '../components/gamification/LevelProgress';
import QuestTracker from '../components/gamification/QuestTracker';
import ExperienceToast from '../components/gamification/ExperienceToast';
import SafeIcon from '../common/SafeIcon';

export default function StudentDashboard() {
  const { user, walletAddress, enrollments, courses, unlockedBadges, level, xp, streak, dailyQuests } = useAcademyStore();
  
  useEffect(() => {
    trackAcademyEvent('DASHBOARD_VIEWED', { userId: user?.id });
  }, [user?.id]);

  if (!user && !walletAddress) {
    return <Navigate to="/" replace />;
  }

  const activeEnrollments = enrollments.filter(e => e.status !== 'completed');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ExperienceToast />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">Command Center</h1>
          <p className="text-gray-500 font-medium tracking-tight">Operator: {user?.email || walletAddress?.slice(0, 8)}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <StreakCounter days={streak} />
          <div className="bg-gray-900 border border-gray-800 px-6 py-4 rounded-3xl flex items-center space-x-6 shadow-xl">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5">Unlocked</p>
              <div className="flex items-center space-x-2">
                <SafeIcon name="Award" className="h-4 w-4 text-emerald-500" />
                <span className="text-2xl font-black text-white leading-none">{unlockedBadges.length}</span>
              </div>
            </div>
            <div className="h-10 w-px bg-gray-800" />
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1.5">Total XP</p>
              <span className="text-2xl font-black text-white leading-none">{xp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <LevelProgress level={level} xp={xp} />

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <SafeIcon name="Activity" className="h-5 w-5 text-emerald-500" />
                </div>
                <span>Active Missions</span>
              </h2>
              <Link to="/" className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                Browse All Curriculums
              </Link>
            </div>
            
            <div className="grid gap-6">
              {activeEnrollments.length > 0 ? activeEnrollments.map(enr => {
                const course = courses.find(c => c.id === enr.course_id);
                const totalLessons = course?.modules.flatMap(m => m.lessons).length || 1;
                const progressPercent = (enr.progress.length / totalLessons) * 100;
                return (
                  <motion.div 
                    key={enr.id} 
                    whileHover={{ y: -4 }}
                    className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 group hover:border-emerald-500/30 transition-all shadow-xl"
                  >
                    <div className="relative h-24 w-24 shrink-0">
                      <img src={course?.thumbnail} className="h-full w-full rounded-2xl object-cover border border-gray-800" alt="" />
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white h-8 w-8 rounded-xl flex items-center justify-center border-4 border-gray-900 shadow-lg">
                        <SafeIcon name="Play" className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{course?.title}</h3>
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="bg-gray-950 rounded-full h-2 mb-6 border border-gray-800 overflow-hidden p-[2px]">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${progressPercent}%` }} 
                          className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                        />
                      </div>
                      <Link to={`/learn/${course.id}`} className="inline-flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-700">
                        <span>Initiate Protocol</span>
                        <SafeIcon name="ArrowRight" className="h-3 w-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="bg-gray-900/50 border border-dashed border-gray-800 p-16 text-center rounded-[2.5rem]">
                  <div className="h-16 w-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-600">
                    <SafeIcon name="Plus" className="h-8 w-8" />
                  </div>
                  <p className="text-gray-500 font-bold uppercase text-sm tracking-[0.2em]">No Active Missions Found</p>
                  <Link to="/" className="inline-block mt-4 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:text-emerald-400">
                    Deploy New Training Array
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8 flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <SafeIcon name="Award" className="h-5 w-5 text-emerald-500" />
              </div>
              <span>Achievement Vault</span>
            </h2>
            <TrophyCase />
          </section>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <QuestTracker quests={dailyQuests} />
          
          <Leaderboard />
          
          <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
            <h3 className="text-white font-black text-sm mb-8 uppercase tracking-[0.2em] flex items-center space-x-3">
              <SafeIcon name="Command" className="h-4 w-4 text-emerald-500" />
              <span>Operator Checklist</span>
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Connect Web3 Wallet', done: !!walletAddress },
                { label: 'Reach Level 5', done: level >= 5 },
                { label: 'Daily Goals Cleared', done: dailyQuests.every(q => q.completed) },
                { label: 'First SBT Minted', done: false }
              ].map((item, i) => (
                <div key={i} className={`flex items-center space-x-4 p-4 rounded-2xl border transition-all ${item.done ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-gray-950 border-gray-800/50'}`}>
                  <div className={`h-6 w-6 rounded-lg border flex items-center justify-center shadow-inner ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700 text-transparent'}`}>
                    <SafeIcon name="Check" className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-bold tracking-tight ${item.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{item.label}</span>
                </div>
              ))}
            </div>
            <Link to="/settings" className="w-full mt-8 bg-gray-950 hover:bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center space-x-3 border border-gray-800 transition-all shadow-xl">
              <SafeIcon name="Settings" className="h-4 w-4 text-gray-500" />
              <span>Operator Preferences</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}