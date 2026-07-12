import React from 'react';
import { motion } from 'framer-motion';
import { ConnectWallet, useAddress, useDisconnect } from '@thirdweb-dev/react';
import { useAcademyStore } from '../../store/useAcademyStore';
import SafeIcon from '../../common/SafeIcon';
import { trackAcademyEvent } from '../../lib/utils';

export default function IdentityGateway({ onComplete }) {
  const address = useAddress();
  const disconnect = useDisconnect();
  const { user, setUser, setWalletAddress, walletAddress } = useAcademyStore();
  const [email, setEmail] = React.useState('');

  // Sync Thirdweb state with Zustand store
  React.useEffect(() => {
    if (address && address !== walletAddress) {
      setWalletAddress(address);
      trackAcademyEvent('LOGIN_SUCCESS', { method: 'web3', walletAddress: address });
    }
  }, [address, walletAddress, setWalletAddress]);

  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (email) {
      setUser({ email, id: `usr-${Date.now()}` });
      trackAcademyEvent('LOGIN_SUCCESS', { method: 'email', userId: email });
      if (onComplete) onComplete();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
      
      <div className="text-center mb-8 relative z-10">
        <div className="bg-gray-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-700 shadow-inner">
          <SafeIcon name="Shield" className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Identity Gateway</h2>
        <p className="text-sm text-gray-400 mt-2 px-4">
          Establish your identity on the AXiM Network to manage credentials.
        </p>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
            Web3 Authentication
          </label>
          <div className="w-full flex justify-center bg-gray-950/50 p-4 rounded-2xl border border-gray-800/50">
            <ConnectWallet 
              theme="dark" 
              btnTitle="Connect Wallet" 
              className="!w-full !bg-emerald-600 hover:!bg-emerald-500 !text-white !rounded-xl !transition-all !border-none !font-bold" 
            />
          </div>
          {address && (
            <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <span className="text-xs font-mono text-emerald-400">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button 
                onClick={disconnect}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-tighter"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
            <span className="px-3 bg-gray-900 text-gray-600">Secure Protocol</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
              Legacy Access
            </label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="operator@axim.systems"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 px-4 rounded-xl border border-gray-700 transition-all flex items-center justify-center space-x-2 group"
          >
            <SafeIcon name="Mail" className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
            <span>Continue with Email</span>
          </button>
        </form>
      </div>
    </motion.div>
  );
}