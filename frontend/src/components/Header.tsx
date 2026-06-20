import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Search } from 'lucide-react';

export const Header: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const logout = auth?.logout;
  const searchQuery = auth?.searchQuery || '';
  const setSearchQuery = auth?.setSearchQuery || (() => {});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${weekday}, ${month} ${day}, ${timeStr}`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').substring(0, 1).toUpperCase();
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <>
      {/* 1. Left Sidebar Navigation Menu */}
      <Sidebar />

      {/* 2. Top Header Navigation Bar (Right-shifted to make room for Sidebar) */}
      <div className="bg-white/85 backdrop-blur-md border border-slate-200/60 w-[calc(100%-104px)] sticky top-4 z-40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ml-[88px] mr-4 mt-4 rounded-2xl select-none">
        <div className="flex items-center justify-between px-6 h-[52px] w-full gap-4">
          
          {/* Left panel spacer / logo placeholder if collapsed */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase font-sans">
              Deepwoods Green Workspace
            </span>
          </div>

          {/* Right actions stack */}
          <div className="flex items-center gap-5 shrink-0">
            {/* Clock Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/50 rounded-full text-[10.5px] font-extrabold text-slate-500 font-sans shadow-sm select-none shrink-0">
              <span className="text-brand-primary">🕒</span>
              <span>{formatDateTime(currentTime)}</span>
            </div>

            {/* Quick Search */}
            <div className="relative flex items-center hidden sm:flex">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search checklist..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-36 md:w-48 bg-slate-50 border border-slate-200/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-sans font-medium"
              />
            </div>

            {/* Profile avatar and details stacked */}
            {user && (
              <div
                className="flex items-center gap-2.5 cursor-pointer p-1 shrink-0 select-none border-l border-slate-100 pl-4"
                onClick={handleLogout}
                title="Click to logout"
              >
                <div className="w-7 h-7 rounded-full bg-brand-secondary text-brand-primary flex items-center justify-center text-xs font-black uppercase shrink-0 border border-brand-primary/20">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[11px] font-black text-slate-800 hover:text-brand-primary transition-colors leading-tight">
                    {user.name} ▾
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 leading-tight mt-0.5">
                    {user.email}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-[28px] p-6 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4 border border-brand-primary/20 text-lg">
              🚪
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-2 font-sans">
              Confirm Sign Out
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-6 leading-relaxed font-sans">
              Are you sure you want to log out of the Deepwoods Task Manager?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 font-sans"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout?.();
                  navigate('/login');
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.98] font-sans"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
