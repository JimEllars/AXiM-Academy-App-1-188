import ErrorBoundary from "../../common/ErrorBoundary";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import QuizEngine from './QuizEngine';
import VideoPlayer from './VideoPlayer';
import LiveStreamRoom from './LiveStreamRoom';
import OnyxAssistant from './OnyxAssistant';
import ResourceVault from './ResourceVault';
import { useAcademyStore } from '../../store/useAcademyStore';
import BadgeNotification from '../gamification/BadgeNotification';

function InteractiveClassroom({ course, enrollment, onProgress }) {
  const [activeLessonId, setActiveLessonId] = useState(course.modules[0]?.lessons[0]?.id);
  const [showFeedback, setShowFeedback] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const [activeTab, setActiveTab] = useState('lesson'); // 'lesson' | 'resources' | 'ai'
  
  const getLessonStatus = (lessonId) => {
    return enrollment.progress.some(p => p.lesson_id === lessonId && p.is_completed) ? 'completed' : 'pending';
  };

  const activeLesson = course.modules.flatMap(m => m.lessons).find(l => l.id === activeLessonId);
  const isLastLesson = course.modules.flatMap(m => m.lessons).at(-1)?.id === activeLessonId;

  const handleComplete = (score) => {
    onProgress(activeLessonId, score);
    if (isLastLesson) {
      setShowFeedback(true);
      if (course.badge) setNewBadge(course.badge);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950 overflow-hidden">
      <BadgeNotification badge={newBadge} onClose={() => setNewBadge(null)} />
      
      {/* Course Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-gray-950/80 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">
            <SafeIcon name="Box" className="h-3 w-3" />
            <span>Operational Mode</span>
          </div>
          <h2 className="text-lg font-bold text-white line-clamp-2 leading-tight">{course.title}</h2>
          <div className="mt-4 bg-gray-900 rounded-full h-1 border border-gray-800 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-700" 
              style={{ width: `${(enrollment.progress.length / course.modules.flatMap(m => m.lessons).length) * 100}%` }} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {course.modules.map((mod, i) => (
            <div key={mod.id}>
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-2">Unit {i + 1}</h3>
              <div className="space-y-1">
                {mod.lessons.map(lesson => {
                  const isCompleted = getLessonStatus(lesson.id) === 'completed';
                  const isActive = activeLessonId === lesson.id;
                  return (
                    <button 
                      key={lesson.id} 
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all ${isActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-white' : 'text-gray-500 hover:bg-gray-900'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <SafeIcon 
                          name={isCompleted ? 'CheckCircle' : lesson.type === 'video' ? 'Play' : lesson.type === 'live' ? 'Radio' : 'FileText'} 
                          className={`h-3.5 w-3.5 ${isCompleted ? 'text-emerald-500' : lesson.type === 'live' ? 'text-red-500' : 'text-gray-500'}`} 
                        />
                        <span className="text-xs font-bold uppercase tracking-tight">{lesson.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070707]">
        {/* Interaction Tabs */}
        <div className="h-14 border-b border-gray-800 bg-gray-950/50 flex items-center px-4 space-x-6">
          {[
            { id: 'lesson', label: 'Curriculum', icon: 'BookOpen' },
            { id: 'resources', label: 'Vault', icon: 'Layers' },
            { id: 'ai', label: 'Onyx AI', icon: 'Cpu' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 h-full px-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <SafeIcon name={tab.icon} className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'lesson' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                {showFeedback ? (
                  <div className="max-w-2xl mx-auto py-12 text-center animate-in zoom-in duration-500">
                    <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
                      <SafeIcon name="Award" className="h-12 w-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Certification Complete</h1>
                    <p className="text-gray-400 mb-12">Your performance has been logged on the AXiM Ledger. Access your credentials in the Command Center.</p>
                    <div className="flex space-x-4 justify-center">
                      <button onClick={() => window.location.hash = '#/dashboard'} className="bg-gray-800 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-gray-700 hover:bg-gray-700 transition-all">
                        Command Center
                      </button>
                      <button onClick={() => window.location.hash = `#/certificate/${enrollment.id}`} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 transition-all">
                         View Certificate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-5xl mx-auto">
                    {activeLesson?.type === 'video' ? (
                      <VideoPlayer url={activeLesson.videoUrl} title={activeLesson.title} onComplete={handleComplete} />
                    ) : activeLesson?.type === 'live' ? (
                      <LiveStreamRoom lesson={activeLesson} onComplete={handleComplete} />
                    ) : activeLesson?.type === 'article' ? (
                      <div className="max-w-3xl mx-auto space-y-8 prose prose-invert">
                        <h1 className="text-4xl font-black uppercase tracking-tight text-white">{activeLesson.title}</h1>
                        <div className="text-gray-400 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                        <button onClick={handleComplete} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20">
                          Finalize Objective
                        </button>
                      </div>
                    ) : (
                      <QuizEngine quizData={activeLesson?.quizData || []} onComplete={handleComplete} />
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'resources' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto py-12">
                <ResourceVault resources={course.resources} />
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                <OnyxAssistant courseTitle={course.title} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
export default function InteractiveClassroomWithBoundary(props) {
  return (
    <ErrorBoundary>
      <InteractiveClassroom {...props} />
    </ErrorBoundary>
  );
}
