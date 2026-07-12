import React from 'react';
import SafeIcon from '../../common/SafeIcon';

export default function CurriculumEditor({ modules, setModules }) {
  const addModule = () => {
    setModules([...modules, { id: `m-${Date.now()}`, title: 'New Module', lessons: [] }]);
  };

  const updateModuleTitle = (idx, title) => {
    const newModules = [...modules];
    newModules[idx].title = title;
    setModules(newModules);
  };

  const addLesson = (modIdx) => {
    const newModules = [...modules];
    newModules[modIdx].lessons.push({ 
      id: `l-${Date.now()}`, 
      title: 'Untethered Lesson', 
      type: 'video',
      duration: '15m'
    });
    setModules(newModules);
  };

  return (
    <div className="space-y-6">
      {modules.map((mod, modIdx) => (
        <div key={mod.id} className="bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden shadow-xl">
          <div className="p-6 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="h-8 w-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 font-black text-xs">
                {modIdx + 1}
              </div>
              <input 
                value={mod.title}
                onChange={(e) => updateModuleTitle(modIdx, e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-white font-bold p-0 w-full"
              />
            </div>
            <button 
              onClick={() => addLesson(modIdx)}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-800 transition-all flex items-center space-x-2"
            >
              <SafeIcon name="Plus" className="h-3 w-3" />
              <span>Append Lesson</span>
            </button>
          </div>
          
          <div className="p-6 space-y-3">
            {mod.lessons.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-gray-800 rounded-2xl bg-gray-950/30">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No Lessons Assigned</p>
              </div>
            ) : (
              mod.lessons.map((lesson, lesIdx) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-950 rounded-2xl border border-gray-800 group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center space-x-4">
                    <SafeIcon name={lesson.type === 'video' ? 'Play' : 'FileText'} className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-bold text-gray-300">{lesson.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><SafeIcon name="Edit" className="h-3.5 w-3.5" /></button>
                    <button className="p-2 hover:bg-gray-800 rounded-lg text-red-500"><SafeIcon name="Trash2" className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
      
      <button 
        onClick={addModule}
        className="w-full py-6 border-2 border-dashed border-gray-800 rounded-[2rem] text-gray-500 hover:border-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all text-xs font-black uppercase tracking-[0.3em]"
      >
        + Initialize New Module Array
      </button>
    </div>
  );
}