import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAcademyStore } from '../store/useAcademyStore';
import SafeIcon from '../common/SafeIcon';

export default function PartnerApplication() {
  const { user, applyForPartnership } = useAcademyStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'AI Optimization',
    bio: '',
    experience: '',
    portfolio_url: '',
    revenue_expectation: '70'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    applyForPartnership({ ...formData, user_id: user?.id || 'anon' });
    setSubmitted(true);
    setTimeout(() => navigate('/dashboard'), 3000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 border border-emerald-500/20 p-12 rounded-[2.5rem] text-center max-w-lg shadow-2xl"
        >
          <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20">
            <SafeIcon name="Check" className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Uplink Successful</h2>
          <p className="text-gray-400 font-medium">Your application has been transmitted to the AXiM Council. You will receive a secure notification within 48 hours.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <SafeIcon name="Shield" className="h-4 w-4" />
            <span>Join the Architect Network</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">
            Architect the <span className="text-emerald-500">Future</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            Scale your proprietary knowledge across the AXiM ecosystem. Approved partners receive premium distribution and automated revenue sharing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Legal Name / Entity</label>
              <input 
                type="text" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Cyberdyne Systems"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Primary Domain</label>
              <select 
                value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-white outline-none transition-all"
              >
                <option>AI Optimization</option>
                <option>Web3 Infrastructure</option>
                <option>Hardware Protocol</option>
                <option>Financial Engineering</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Professional Abstract</label>
            <textarea 
              required rows="4"
              value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              placeholder="Detail your technical background and what you intend to teach..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Verification Link (Portfolio/LinkedIn)</label>
              <input 
                type="url" required
                value={formData.portfolio_url} onChange={e => setFormData({...formData, portfolio_url: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="https://docs.axim.systems/operator"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Revenue Share (%)</label>
              <input 
                type="number" max="90" min="50"
                value={formData.revenue_expectation} onChange={e => setFormData({...formData, revenue_expectation: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center space-x-3">
              <SafeIcon name="Zap" className="h-5 w-5" />
              <span>Initiate Partnership Protocol</span>
            </button>
            <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-6">
              By submitting, you agree to the AXiM Decentralized Instructor Framework.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}