import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';

export default function HeroCatalog() {
  const { isLoading } = useAcademyStore();
  return (
    <div className="relative overflow-hidden bg-gray-950 pt-16 pb-32 border-b border-gray-800">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/80 to-gray-950" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {isLoading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto" />
              <div className="h-16 md:h-24 bg-gray-800 rounded-lg max-w-3xl mx-auto" />
              <div className="h-6 bg-gray-800 rounded-lg max-w-2xl mx-auto" />
              <div className="h-6 bg-gray-800 rounded-lg max-w-xl mx-auto" />
            </div>
          ) : (
            <>
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <SafeIcon name="Zap" className="h-4 w-4" />
                <span>Powered by AXiM Core & Onyx AI</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
                Decentralized <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Learning Hub</span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-gray-400 mb-10">
                Master proprietary systems arrayed across the AXiM ecosystem. Earn Soulbound NFTs on Arbitrum One to permanently unlock internal database access.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}