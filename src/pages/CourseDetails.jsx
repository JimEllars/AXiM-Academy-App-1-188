import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAcademyStore } from '../store/useAcademyStore';
import SafeIcon from '../common/SafeIcon';
import CheckoutModal from '../components/transaction/CheckoutModal';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, enrollments } = useAcademyStore();
  const [showCheckout, setShowCheckout] = React.useState(false);

  const course = courses.find(c => c.id === id);
  const isEnrolled = enrollments.some(e => e.course_id === id);

  if (!course) return <div className="p-20 text-center text-white">Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src={course.thumbnail} 
          className="w-full h-full object-cover opacity-30" 
          alt={course.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full">
                  {course.category}
                </span>
                <span className="text-gray-400 text-sm font-medium">• {course.duration}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight">
                {course.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-16 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">About this Curriculum</h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              {course.long_description}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Course Structure</h2>
            <div className="space-y-4">
              {course.modules.map((mod, i) => (
                <div key={mod.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Module {i+1}: {mod.title}</h3>
                    <span className="text-xs text-gray-500 font-bold uppercase">{mod.lessons.length} Lessons</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {mod.lessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center space-x-3">
                          <SafeIcon name={lesson.type === 'video' ? 'Play' : 'FileText'} className="h-4 w-4 text-emerald-500" />
                          <span>{lesson.title}</span>
                        </div>
                        <span className="text-xs font-mono">{lesson.duration || 'Quiz'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Action Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Tuition Fee</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-white">${course.price_usd}</span>
                <span className="text-gray-500">USD</span>
              </div>
              <p className="text-emerald-400 font-mono mt-1">≈ {course.price_crypto} ETH</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <SafeIcon name="Award" className="h-5 w-5 text-emerald-500" />
                <span>Arbitrum Soulbound Token (SBT)</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <SafeIcon name="Infinity" className="h-5 w-5 text-emerald-500" />
                <span>Lifetime System Access</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <SafeIcon name="MessageSquare" className="h-5 w-5 text-emerald-500" />
                <span>Onyx AI Support Tuning</span>
              </div>
            </div>

            {isEnrolled ? (
              <button 
                onClick={() => navigate(`/learn/${course.id}`)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center space-x-2"
              >
                <SafeIcon name="Play" className="h-5 w-5" />
                <span>Continue Learning</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowCheckout(true)}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 rounded-xl transition-all"
              >
                Enroll Now
              </button>
            )}
          </div>
        </div>
      </div>

      {showCheckout && <CheckoutModal course={course} onClose={() => setShowCheckout(false)} />}
    </div>
  );
}