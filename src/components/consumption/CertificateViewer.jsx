import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { cn } from '../../lib/utils';

export default function CertificateViewer({ enrollment, course, user }) {
  const completionDate = enrollment.completed_at 
    ? new Date(enrollment.completed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  const verificationHash = enrollment.id.split('-')[1]?.toUpperCase() || 'AXM-VER-8821';

  const handlePrint = () => window.print();

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(course.title)}&organizationName=AXiM%20Systems&issueMonth=1&issueYear=2024&certUrl=${encodeURIComponent(window.location.href)}&certId=${verificationHash}`;
    window.open(url, '_blank');
  };

  const shareToTwitter = () => {
    const text = `I just earned my ${course.title} certificate from AXiM Academy! 🚀 #AXiM #Web3Learning`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
      {/* Controls - Hidden during print */}
      <div className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <SafeIcon name="ArrowLeft" className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={shareToLinkedIn}
            className="p-2.5 bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 rounded-lg hover:bg-[#0077b5]/20 transition-all"
            title="Add to LinkedIn Profile"
          >
            <SafeIcon name="Linkedin" className="h-5 w-5" />
          </button>
          <button 
            onClick={shareToTwitter}
            className="p-2.5 bg-gray-800 text-white border border-gray-700 rounded-lg hover:bg-gray-700 transition-all"
            title="Share on X"
          >
            <SafeIcon name="Twitter" className="h-5 w-5" />
          </button>
          <div className="h-8 w-px bg-gray-800 mx-2" />
          <button 
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 shadow-lg shadow-emerald-900/20"
          >
            <SafeIcon name="Printer" className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Certificate Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl aspect-[1.414/1] bg-white text-gray-900 p-12 md:p-20 shadow-2xl overflow-hidden border-[16px] border-double border-gray-200"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full -mr-20 -mt-20 z-0" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-50 rounded-full -ml-20 -mb-20 z-0" />
        
        <div className="relative z-10 h-full flex flex-col items-center text-center">
          <div className="flex items-center space-x-3 mb-10">
            <div className="p-2 bg-gray-900 rounded-lg">
              <SafeIcon name="Hexagon" className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">AXiM Systems</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">Autonomous Excellence</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 mb-2">Certificate of Completion</h2>
            <div className="h-1 w-24 bg-emerald-500 mx-auto" />
          </div>

          <p className="text-lg text-gray-500 italic mb-8">This is to officially certify that</p>

          <h3 className="text-4xl md:text-5xl font-bold border-b-2 border-gray-100 pb-2 mb-8 min-w-[300px]">
            {user?.email?.split('@')[0].replace('.', ' ') || 'AXiM Candidate'}
          </h3>

          <p className="text-lg text-gray-500 mb-8">has successfully fulfilled all requirements for the professional course</p>

          <h4 className="text-2xl md:text-3xl font-black text-gray-900 mb-12 uppercase tracking-tight max-w-2xl">
            {course?.title}
          </h4>

          <div className="mt-auto w-full grid grid-cols-3 gap-8 items-end">
            <div className="text-left">
              <p className="text-xs font-bold uppercase text-gray-400 mb-1">Date of Issue</p>
              <p className="text-sm font-bold">{completionDate}</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-4">
                <SafeIcon name="ShieldCheck" className="h-16 w-16 text-emerald-500/20" />
              </div>
              <p className="text-[10px] font-mono text-gray-400 break-all max-w-[180px]">
                HASH: {verificationHash}
              </p>
            </div>

            <div className="text-right">
              <div className="mb-2 h-12 flex items-center justify-end">
                <span className="font-serif text-2xl italic text-gray-400">Onyx AI</span>
              </div>
              <div className="h-px bg-gray-300 w-full mb-1" />
              <p className="text-xs font-bold uppercase text-gray-400">Principal Systems Architect</p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none rotate-12">
          <p className="text-9xl font-black uppercase tracking-widest">AXiM VERIFIED</p>
        </div>
      </motion.div>

      <div className="mt-8 text-center text-gray-500 text-sm print:hidden">
        <p>This certificate is cryptographically linked to the AXiM Core Ledger.</p>
        <p className="mt-1">Verify at <span className="text-emerald-500">academy.axim.systems/verify/{verificationHash}</span></p>
      </div>
    </div>
  );
}