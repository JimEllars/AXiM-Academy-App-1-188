import React from 'react';
import SafeIcon from '../../common/SafeIcon';

export default function ResourceVault({ resources }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold uppercase tracking-tight text-sm">Proprietary Assets</h3>
        <span className="text-[10px] text-gray-500 font-bold uppercase">{resources?.length || 0} Files</span>
      </div>
      
      <div className="grid gap-3">
        {resources?.map((res) => (
          <div key={res.id} className="group flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-gray-950 rounded-xl text-emerald-500 border border-gray-800">
                <SafeIcon name={res.type === 'pdf' ? 'FileText' : 'Image'} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">{res.title}</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{res.size} • {res.type.toUpperCase()}</p>
              </div>
            </div>
            <button className="p-2 text-gray-500 hover:text-white transition-colors">
              <SafeIcon name="Download" className="h-4 w-4" />
            </button>
          </div>
        ))}
        {(!resources || resources.length === 0) && (
          <div className="py-8 text-center bg-gray-900/40 border border-dashed border-gray-800 rounded-2xl">
            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No assets attached</p>
          </div>
        )}
      </div>
    </div>
  );
}