import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademyStore } from '../../store/useAcademyStore';
import SafeIcon from '../../common/SafeIcon';
import { motion } from 'framer-motion';
import SkeletonCard from './SkeletonCard';
import { trackAcademyEvent } from '../../lib/utils';

export default function CourseGrid() {
  const { courses, searchQuery, activeCategory, setActiveCategory, isLoading } = useAcademyStore();
  const navigate = useNavigate();
  const categories = ['All', 'Hardware', 'Finance', 'AI', 'Protocol'];

  const filteredCourses = courses.filter(course => {
    if (course.is_approved !== true) return false;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (!isLoading) {
      trackAcademyEvent('STOREFRONT_CATALOG_RENDERED', { itemCount: courses.length });
    }
  }, [isLoading]); // Intentionally omitting courses to only fire on initial load completion

  return (
    <div className="py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Available Curriculums</h2>
          <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-widest">Protocol Version 4.2.0 Active</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                activeCategory === cat 
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-24 text-center bg-gray-900/40 border-2 border-dashed border-gray-800 rounded-[3rem]">
          <SafeIcon name="Search" className="h-16 w-16 text-gray-700 mx-auto mb-6" />
          <p className="text-gray-500 font-bold uppercase tracking-widest">Zero Matches in Current Array</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCourses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              onMouseEnter={() => { if (!window._prefetched) window._prefetched = new Set(); if (!window._prefetched.has(`/course/${course.id}`)) { window._prefetched.add(`/course/${course.id}`); const link = document.createElement('link'); link.rel = 'prefetch'; link.href = `/course/${course.id}`; document.head.appendChild(link); } }}
              onClick={() => navigate(`/course/${course.id}`)}
              className="group cursor-pointer bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden hover:border-emerald-500/50 transition-all duration-500 shadow-2xl relative flex flex-col"
            >
              <div className="h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent z-10" />
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale-[0.5] group-hover:grayscale-0" 
                />
                <div className="absolute top-6 left-6 z-20 flex space-x-2">
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg">
                    {course.difficulty}
                  </span>
                  {course.badge && (
                    <span className="bg-gray-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                      SBT Reward
                    </span>
                  )}
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{course.category}</span>
                  <div className="flex items-center space-x-2 text-gray-500 text-[10px] font-bold uppercase">
                    <SafeIcon name="Clock" className="h-3 w-3" />
                    <span>{course.duration}</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-4 line-clamp-2 group-hover:text-emerald-400 transition-colors leading-tight">
                  {course.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-8 flex-1 line-clamp-2 leading-relaxed font-medium">
                  {course.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-white">${course.price_usd}</span>
                    <span className="text-[10px] font-black text-gray-600 uppercase">USD</span>
                  </div>
                  <div className="h-10 w-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:rotate-12">
                    <SafeIcon name="ArrowRight" className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}