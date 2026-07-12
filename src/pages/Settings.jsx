import React, { useState } from 'react';
import { useAcademyStore } from '../store/useAcademyStore';
import SafeIcon from '../common/SafeIcon';

export default function Settings() {
  const { user, setUser, walletAddress, role } = useAcademyStore();
  const [profile, setProfile] = useState({
    name: user?.email?.split('@')[0] || 'AXiM Operator',
    email: user?.email || '',
    bio: 'Senior Systems Architect specializing in Layer-2 hardware optimization.'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Operator Profile</h1>
        <p className="text-gray-500 font-medium">Manage your network identity and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Display Name</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                value={profile.email}
                disabled
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-500 outline-none cursor-not-allowed" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bio / Credentials</label>
              <textarea 
                rows="4"
                value={profile.bio}
                onChange={e => setProfile({...profile, bio: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none resize-none" 
              />
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-emerald-900/20">
              Synchronize Changes
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-tight">Security & Privacy</h3>
            <div className="space-y-4">
              {[
                { label: 'Public Leaderboard', desc: 'Display your rank and XP to other operators', active: true },
                { label: 'Network Notifications', desc: 'Receive alerts for new curriculum deployments', active: true },
                { label: 'Anonymous SBT Minting', desc: 'Hide your wallet address on legacy certificates', active: false }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-950 rounded-2xl border border-gray-800">
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">{item.label}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full transition-colors relative ${item.active ? 'bg-emerald-600' : 'bg-gray-800'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.active ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 text-center">
            <div className="h-24 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <SafeIcon name="User" className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold uppercase tracking-tight">{profile.name}</h3>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">{role} Operator</p>
            <div className="mt-6 pt-6 border-t border-gray-800 space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-gray-500">Node Status</span>
                <span className="text-emerald-400">Verified</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-gray-500">Network ID</span>
                <span className="text-gray-300">#AXM-{walletAddress?.slice(-4) || '8221'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}