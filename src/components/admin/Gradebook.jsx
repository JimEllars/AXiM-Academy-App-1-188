import React from 'react';
import SafeIcon from '../../common/SafeIcon';

export default function Gradebook({ enrollments, courses }) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <h3 className="text-white font-bold uppercase tracking-tight">Performance Ledger</h3>
        <button className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center space-x-2">
          <SafeIcon name="Download" className="h-3 w-3" />
          <span>Export CSV</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-950 border-b border-gray-800">
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Candidate</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Curriculum</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Avg. Quiz</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Enrollment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {enrollments.map((enr) => {
              const course = courses.find(c => c.id === enr.course_id);
              const scores = Object.values(enr.quizScores || {});
              const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
              
              return (
                <tr key={enr.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
                        {enr.id.slice(-2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-200">Candidate_{enr.id.slice(-4)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 font-bold">{course?.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      enr.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {enr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-white">{avgScore}%</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{new Date(enr.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}