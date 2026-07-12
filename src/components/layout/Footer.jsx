import React from 'react';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 pt-20 pb-10 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 group mb-6">
              <div className="p-1.5 bg-gray-900 rounded-lg border border-gray-800">
                <SafeIcon name="Hexagon" className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="font-black text-xl tracking-tighter text-white uppercase">AXiM Academy</span>
            </Link>
            <p className="text-gray-500 max-w-sm text-sm leading-relaxed font-medium">
              The professional educational infrastructure for the AXiM Core Network. 
              Decentralized credentials, AI-driven curricula, and on-chain verification.
            </p>
            <div className="flex space-x-4 mt-8">
              {['Twitter', 'Github', 'MessageCircle'].map(icon => (
                <button key={icon} className="h-10 w-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                  <SafeIcon name={icon} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6">Ecosystem</h4>
            <ul className="space-y-4">
              {['Core Relay', 'Onyx AI', 'Green Machine', 'Identity Gateway'].map(item => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-emerald-400 text-sm font-bold transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6">Governance</h4>
            <ul className="space-y-4">
              {['Whitepaper', 'DAO Proposals', 'Legal Specs', 'Security Audit'].map(item => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-emerald-400 text-sm font-bold transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-900 gap-6">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
            © 2024 AXiM Systems. All Operational Rights Reserved.
          </p>
          <div className="flex items-center space-x-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
            <a href="#" className="hover:text-white transition-colors">Term of Service</a>
            <div className="flex items-center space-x-2 text-emerald-500/50">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Network Status: Optimal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}