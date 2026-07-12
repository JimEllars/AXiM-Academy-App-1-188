import React from 'react';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function FinancialsPanel({ partnerId }) {
  const { earnings, courses } = useAcademyStore();
  
  const partnerEarnings = earnings.filter(e => !partnerId || e.partner_id === partnerId);
  const totalPartnerEarned = partnerEarnings.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPlatformEarned = partnerEarnings.reduce((acc, curr) => acc + curr.platform_amount, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Gross Revenue', value: `$${(totalPartnerEarned + totalPlatformEarned).toFixed(2)}`, icon: 'DollarSign' },
          { label: 'Partner Share', value: `$${totalPartnerEarned.toFixed(2)}`, icon: 'UserCheck' },
          { label: 'Platform Fee', value: `$${totalPlatformEarned.toFixed(2)}`, icon: 'Cpu' }
        ].map((stat, i) => (
          <div key={i} className="bg-gray-950 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <SafeIcon name={stat.icon} className="h-12 w-12" />
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 bg-gray-900/50">
          <h3 className="text-white font-bold uppercase tracking-tight text-sm">Transaction Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-800">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Course</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Partner Share</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Platform</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {partnerEarnings.map((earn) => {
                const course = courses.find(c => c.id === earn.course_id);
                return (
                  <tr key={earn.id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300 font-bold">{course?.title}</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono text-xs">+${earn.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">${earn.platform_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500 text-[10px] font-bold">{new Date(earn.timestamp).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}