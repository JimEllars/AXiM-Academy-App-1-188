import React, { useState } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function PromoManager() {
  const { promoCodes, addPromoCode } = useAcademyStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', discount: 10, max: 100 });

  const handleSubmit = (e) => {
    e.preventDefault();
    addPromoCode(newPromo);
    setShowAdd(false);
    setNewPromo({ code: '', discount: 10, max: 100 });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">Access Control & Promos</h3>
          <p className="text-gray-500 text-xs font-bold uppercase mt-1">Manage network entrance tokens and affiliate grants</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          Generate Code
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-900 border border-emerald-500/20 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Alpha Code</label>
              <input 
                type="text" 
                value={newPromo.code}
                onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500" 
                placeholder="ONYX-2024"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Discount %</label>
              <input 
                type="number" 
                value={newPromo.discount}
                onChange={e => setNewPromo({...newPromo, discount: parseInt(e.target.value)})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Max Uses</label>
              <input 
                type="number" 
                value={newPromo.max}
                onChange={e => setNewPromo({...newPromo, max: parseInt(e.target.value)})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold text-xs uppercase">Deploy</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg"><SafeIcon name="X" className="h-4 w-4" /></button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-900/50 border-b border-gray-800">
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Code</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Grant</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Utilization</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {promoCodes.map(promo => (
              <tr key={promo.id} className="hover:bg-gray-900/30 transition-colors">
                <td className="px-6 py-4 font-mono text-emerald-400 font-bold">{promo.code}</td>
                <td className="px-6 py-4 text-sm text-white">{promo.discount}% Off</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 font-bold">{promo.uses}/{promo.max}</span>
                    <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(promo.uses/promo.max)*100}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}