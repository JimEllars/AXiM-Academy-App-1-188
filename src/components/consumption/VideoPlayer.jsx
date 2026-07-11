import React from 'react';
import SafeIcon from '../../common/SafeIcon';

export default function VideoPlayer({ url, title, onComplete }) {
  return (
    <div className="space-y-6">
      <div className="aspect-video bg-black rounded-3xl border border-gray-800 shadow-2xl overflow-hidden relative group">
        <iframe
          src={url}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gray-900 border border-gray-800 rounded-2xl">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h2>
          <p className="text-gray-400 text-sm mt-1">AXiM Authorized Educational Material</p>
        </div>
        <button 
          onClick={onComplete}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/20"
        >
          <span>Complete Video</span>
          <SafeIcon name="CheckCircle" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}