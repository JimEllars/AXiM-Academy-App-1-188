import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAcademyStore } from '../../store/useAcademyStore';
import { useAddress, ConnectWallet } from '@thirdweb-dev/react';
import SafeIcon from '../../common/SafeIcon';

export default function Navbar() {
  const { user, searchQuery, setSearchQuery, role, setRole } = useAcademyStore();
  const address = useAddress();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8 flex-1">
            <Link to="/" className="flex items-center space-x-2 group shrink-0">
              <div className="p-1.5 bg-gray-900 rounded-lg group-hover:bg-emerald-500/10 transition-colors border border-gray-800">
                <SafeIcon name="Hexagon" className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="font-black text-lg tracking-tighter text-white uppercase hidden sm:block">AXiM Academy</span>
            </Link>

            {isHome && (
              <div className="relative max-w-md w-full hidden md:block">
                <SafeIcon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search curriculums..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-4 mr-4 border-r border-gray-800 pr-4">
              <button 
                onClick={() => setRole(role === 'student' ? 'teacher' : 'student')}
                className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400"
              >
                Switch to {role === 'student' ? 'Instructor' : 'Learner'}
              </button>
            </div>

            <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors">
              Catalog
            </Link>

            {(user || address) ? (
              <div className="flex items-center space-x-4">
                <Link to={role === 'teacher' ? '/teacher' : '/dashboard'} className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-xl transition-all border border-gray-800">
                  <SafeIcon name="Grid" className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-200">
                    {role === 'teacher' ? 'Admin' : 'Portal'}
                  </span>
                </Link>
                <div className="hidden sm:block">
                  <ConnectWallet 
                    theme="dark" 
                    btnTitle="Connect"
                    className="!bg-gray-800 !h-10 !px-4 !text-[10px] !font-black !rounded-xl !border-gray-700 !text-gray-300 hover:!bg-gray-700 !uppercase !tracking-widest"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <ConnectWallet 
                  theme="dark"
                  btnTitle="Sign In"
                  className="!bg-emerald-600 !h-10 !px-6 !text-[10px] !font-black !rounded-xl !text-white hover:!bg-emerald-500 !transition-all !uppercase !tracking-widest"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}