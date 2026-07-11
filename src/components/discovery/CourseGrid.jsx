import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademyStore } from '../../store/useAcademyStore';
import SafeIcon from '../../common/SafeIcon';

export default function CourseGrid() {
  const { courses, searchQuery, activeCategory, setActiveCategory } = useAcademyStore();
  const navigate = useNavigate();

  const categories = ['All', 'Hardware', 'Finance', 'AI'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Available Curriculums</h2>
          <p className="text-gray-500 mt-1">Professional certifications for the AXiM ecosystem.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
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

      {filteredCourses.length === 0 ? (
        <div className="py-20 text-center">
          <SafeIcon name="Search" className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No courses found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div 
              key={course.id} 
              onClick={() => navigate(`/course/${course.id}`)}
              className="group cursor-pointer bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 shadow-lg relative flex flex-col"
            >
              <div className="h-48 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-4 left-4 z-20 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                  {course.difficulty}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="flex items-center space-x-2 text-gray-500 text-xs">
                    <SafeIcon name="Clock" className="h-3 w-3" />
                    <span>{course.duration}</span>
                  </div>
                  <span className="text-white font-black">${course.price_usd}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}