import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';

export default function VerificationPage() {
  const { hash } = useParams();
  const [inputHash, setInputHash] = useState(hash || '');
  const [status, setStatus] = useState('idle'); // idle, searching, found, not_found

  const handleVerify = (e) => {
    e?.preventDefault();
    if (!inputHash) return;
    
    setStatus('searching');
    // Simulated blockchain/database lookup
    setTimeout(() => {
      if (inputHash.includes('AXM') || inputHash.length > 8) {
        setStatus('found');
      } else {
        setStatus('not_found');
      }
    }, 1500);
  };

  useEffect(() => {
    if (hash) handleVerify();
  }, [hash]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <SafeIcon name="ShieldCheck" className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Credential Verification</h1>
          <p className="text-gray-400 mt-2">Validate the authenticity of AXiM Academy certificates via the Core Ledger.</p>
        </div>

        <form onSubmit={handleVerify} className="relative mb-12">
          <input 
            type="text" 
            value={inputHash}
            onChange={(e) => setInputHash(e.target.value.toUpperCase())}
            placeholder="Enter Certificate Hash (e.g., AXM-VER-8821)"
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-5 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-32"
          />
          <button 
            type="submit"
            disabled={status === 'searching'}
            className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {status === 'searching' ? <SafeIcon name="Loader" className="h-5 w-5 animate-spin" /> : 'Verify'}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status === 'found' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center"
            >
              <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <SafeIcon name="Check" className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Authenticity Confirmed</h2>
              <p className="text-emerald-400/80 text-sm mb-6">This credential was issued to a verified candidate on the AXiM Network.</p>
              
              <div className="grid grid-cols-2 gap-4 text-left border-t border-emerald-500/10 pt-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Course Title</p>
                  <p className="text-sm font-medium text-gray-200">Hardware Link Installation</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Issue Date</p>
                  <p className="text-sm font-medium text-gray-200">January 24, 2024</p>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'not_found' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
            >
              <div className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <SafeIcon name="X" className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Verification Failed</h2>
              <p className="text-red-400/80 text-sm">No record found matching this hash in the AXiM Core Ledger.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}