import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[480px] animate-pulse">
      <div className="h-56 bg-gray-800 relative">
        <div className="absolute top-6 left-6 flex space-x-2">
          <div className="h-6 w-16 bg-gray-700 rounded-lg" />
          <div className="h-6 w-20 bg-gray-700 rounded-lg" />
        </div>
      </div>
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-16 bg-gray-800 rounded" />
          <div className="h-3 w-12 bg-gray-800 rounded" />
        </div>
        <div className="h-6 bg-gray-800 rounded w-3/4 mb-4" />
        <div className="space-y-2 mb-8 flex-1">
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-5/6" />
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-gray-800">
          <div className="h-8 w-24 bg-gray-800 rounded" />
          <div className="h-10 w-10 bg-gray-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
