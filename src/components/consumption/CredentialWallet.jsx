import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function CredentialWallet() {
  const { enrollments, courses } = useAcademyStore();
  const [mintingId, setMintingId] = useState(null);
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');

  const handleMint = async (enrId) => {
    setMintingId(enrId);
    // Simulate Blockchain Transaction
    await new Promise(r => setTimeout(r, 3000));
    setMintingId(null);
    // In real app: update storage/state
  };

  if (completedEnrollments.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
        <SafeIcon name="Award" className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No credentials earned yet. Complete a course to mint your SBT or download your PDF.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {completedEnrollments.map(enr => {
        const course = courses.find(c => c.id === enr.course_id);
        const isMinted = enr.sbt_mint_status === 'minted';
        const isMinting = mintingId === enr.id;
        
        return (
          <div key={enr.id} className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col relative overflow-hidden hover:border-emerald-500/50 transition-all">
            {(isMinted || isMinting) && (
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
            )}
            
            <div className="flex items-start justify-between mb-6 z-10">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl border transition-colors ${isMinted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                  <SafeIcon name={isMinted ? 'Hexagon' : 'FileText'} className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold group-hover:text-emerald-400 transition-colors">{course?.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {isMinted ? 'Arbitrum Soulbound Token' : isMinting ? 'Minting in progress...' : 'Legacy PDF Certificate'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-800 z-10 flex space-x-3">
              {isMinted ? (
                <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg border border-gray-700 transition-colors flex items-center justify-center space-x-2">
                  <SafeIcon name="ExternalLink" className="h-4 w-4" />
                  <span>View on Arbiscan</span>
                </button>
              ) : isMinting ? (
                <div className="flex-1 bg-emerald-500/10 text-emerald-400 text-sm font-medium py-2.5 px-4 rounded-lg border border-emerald-500/20 flex items-center justify-center space-x-2">
                  <SafeIcon name="Loader" className="h-4 w-4 animate-spin" />
                  <span>Mining Block...</span>
                </div>
              ) : (
                <>
                  <Link 
                    to={`/certificate/${enr.id}`}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg border border-gray-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <SafeIcon name="Eye" className="h-4 w-4" />
                    <span>View PDF</span>
                  </Link>
                  <button 
                    onClick={() => handleMint(enr.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <SafeIcon name="Zap" className="h-4 w-4" />
                    <span>Mint SBT</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}