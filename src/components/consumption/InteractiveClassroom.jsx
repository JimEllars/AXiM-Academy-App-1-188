import React, { useState } from 'react';
import SafeIcon from '../../common/SafeIcon';
import QuizEngine from './QuizEngine';
import { Feedback } from '@questlabs/react-sdk';
import { sdkTheme } from '../../theme/sdkTheme';
import { useAcademyStore } from '../../store/useAcademyStore';

const DEMO_QUIZ = [
  {
    question_id: "q-1",
    question_text: "What is the primary function of the memory_banks schema in AXiM Core?",
    options: {
      "A": "To process Stripe payments.",
      "B": "To persist vectorized documentation for RAG implementation.",
      "C": "To cache Cloudflare responses.",
      "D": "To store Web3 wallet private keys."
    },
    correct_answer: "B",
    remediation_hint: "Review the Vector Database architecture module."
  }
];

export default function InteractiveClassroom({ course, enrollment, onProgress }) {
  const [activeLessonId, setActiveLessonId] = useState(course.modules[0]?.lessons[0]?.id);
  const [showFeedback, setShowFeedback] = useState(false);
  const { user } = useAcademyStore();

  const getLessonStatus = (lessonId) => {
    return enrollment.progress.some(p => p.lesson_id === lessonId && p.is_completed) ? 'completed' : 'pending';
  };

  const activeLesson = course.modules.flatMap(m => m.lessons).find(l => l.id === activeLessonId);
  const isLastLesson = course.modules.flatMap(m => m.lessons).at(-1)?.id === activeLessonId;

  const handleComplete = () => {
    onProgress(activeLessonId);
    if (isLastLesson) {
      setShowFeedback(true);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-gray-950/50 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white line-clamp-1">{course.title}</h2>
          <div className="mt-4 bg-gray-900 rounded-full h-1.5 overflow-hidden border border-gray-800">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${(enrollment.progress.length / course.modules.flatMap(m => m.lessons).length) * 100}%` }} 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {course.modules.map((mod, i) => (
            <div key={mod.id}>
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 px-2">Module {i + 1}</h3>
              <div className="space-y-1">
                {mod.lessons.map(lesson => {
                  const isCompleted = getLessonStatus(lesson.id) === 'completed';
                  const isActive = activeLessonId === lesson.id;
                  return (
                    <button 
                      key={lesson.id} 
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 transition-colors ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900'}`}
                    >
                      <SafeIcon 
                        name={isCompleted ? 'CheckCircle' : (lesson.type === 'video' ? 'Play' : 'FileText')} 
                        className={`h-4 w-4 ${isCompleted ? 'text-emerald-500' : 'text-gray-500'}`} 
                      />
                      <span className="text-xs font-bold uppercase tracking-tight">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto p-8 py-12">
          {showFeedback ? (
            <div className="space-y-8">
              <div className="text-center">
                <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <SafeIcon name="Award" className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Curriculum Completed</h1>
                <p className="text-gray-400 mt-2">Your progress has been recorded on the secure ledger.</p>
              </div>
              
              {/* SDK Feedback Integration */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden p-6">
                {/* Normally we'd use the Feedback component from the SDK here */}
                <div className="text-center p-8">
                  <h3 className="text-white font-bold mb-4">Rate this course</h3>
                  <div className="flex justify-center space-x-4">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} className="text-gray-600 hover:text-emerald-400 transition-colors">
                        <SafeIcon name="Star" className="h-8 w-8" />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    placeholder="Tell us what you think..."
                    className="w-full mt-6 bg-gray-950 border border-gray-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    rows={4}
                  />
                  <button className="w-full mt-4 bg-emerald-600 py-3 rounded-xl font-bold text-white">Submit Review</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {activeLesson?.type === 'video' ? (
                <div className="space-y-6">
                  <div className="aspect-video bg-gray-900 rounded-3xl border border-gray-800 flex items-center justify-center relative overflow-hidden group">
                    <div 
                      className="absolute inset-0 bg-cover opacity-20" 
                      style={{ backgroundImage: `url(${course.thumbnail})` }} 
                    />
                    <button className="z-10 bg-emerald-500 text-white h-16 w-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <SafeIcon name="Play" className="h-6 w-6 ml-1" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">{activeLesson.title}</h1>
                    <button 
                      onClick={handleComplete}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2"
                    >
                      <span>Mark Complete</span>
                      <SafeIcon name="ArrowRight" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : activeLesson?.type === 'article' ? (
                <div className="space-y-8">
                  <h1 className="text-4xl font-black text-white uppercase tracking-tight">{activeLesson.title}</h1>
                  <div 
                    className="prose prose-invert max-w-none text-gray-400 prose-headings:text-white prose-p:leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: activeLesson.content }} 
                  />
                  <div className="pt-8 border-t border-gray-800">
                    <button 
                      onClick={handleComplete}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all"
                    >
                      Complete Lesson
                    </button>
                  </div>
                </div>
              ) : (
                <QuizEngine quizData={DEMO_QUIZ} onComplete={handleComplete} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}