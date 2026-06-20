import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Calendar, History, FolderOpen, Users, PlusCircle, Award, TrendingUp, LogOut } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const logout = auth?.logout;
  const navigate = useNavigate();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  React.useEffect(() => {
    if (isExpanded) {
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
    }
    return () => {
      document.body.classList.remove('sidebar-expanded');
    };
  }, [isExpanded]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <>
      <aside 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`fixed left-4 top-4 bottom-4 z-50 bg-gradient-to-b from-[#F4F6F0] to-[#E8EDE5] text-slate-800 rounded-[28px] border border-slate-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out flex flex-col justify-between py-6 select-none ${
          isExpanded ? 'w-[220px]' : 'w-[56px]'
        }`}
      >
        {/* Top: Logo section */}
        <div className="flex flex-col items-center">
          <div className="flex items-center px-4 w-full justify-center overflow-hidden h-12">
            <img 
              src={isExpanded ? "/DeepwoodsR.png" : "/favicon.png"} 
              alt="Deepwoods Green Logo" 
              className={`object-contain transition-all duration-300 shrink-0 ${
                isExpanded ? 'h-9 w-auto' : 'h-7 w-7 mx-auto'
              }`} 
            />
            {isExpanded && (
              <span className="ml-2 text-[8px] font-black text-brand-primary bg-white border border-brand-primary/10 px-1.5 py-0.5 rounded font-sans shrink-0 uppercase tracking-wider">
                DTM-V1
              </span>
            )}
          </div>
          
          <div className="w-4/5 h-[1px] bg-slate-200/60 my-6" />

          {/* Navigation Links list */}
          <nav className={`flex flex-col gap-1.5 w-full transition-all duration-300 ${isExpanded ? 'px-3' : 'px-2'}`}>
            {/* Category: Member */}
            {isExpanded && (
              <span className="text-[7.5px] font-black text-emerald-800 tracking-widest px-3 mb-1 block uppercase">
                MEMBER PORTAL
              </span>
            )}
            
            <NavLink 
              to="/member" 
              end
              className={({ isActive }) => 
                `w-full flex items-center transition-all duration-200 relative py-2.5 ${
                  isExpanded ? 'px-3.5 gap-3.5' : 'pl-3 pr-0 gap-0'
                } ${
                  isActive 
                    ? 'active-nav-tab' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-xl'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`} />
                  {isExpanded && <span className="text-xs font-bold font-sans">Today's List</span>}
                </>
              )}
            </NavLink>

            <NavLink 
              to="/member/history" 
              className={({ isActive }) => 
                `w-full flex items-center transition-all duration-200 relative py-2.5 ${
                  isExpanded ? 'px-3.5 gap-3.5' : 'pl-3 pr-0 gap-0'
                } ${
                  isActive 
                    ? 'active-nav-tab' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-xl'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <History className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`} />
                  {isExpanded && <span className="text-xs font-bold font-sans">Task History</span>}
                </>
              )}
            </NavLink>

            {/* Category: Admin Section (Gated) */}
            {user?.isAdmin && (
              <div className="mt-4 flex flex-col gap-1.5 w-full">
                {isExpanded && (
                  <span className="text-[7.5px] font-black text-emerald-800 tracking-widest px-3 mb-1 block uppercase">
                    ADMIN CONSOLE
                  </span>
                )}
                
                <NavLink 
                  to="/projects" 
                  className={({ isActive }) => 
                    `w-full flex items-center transition-all duration-200 relative py-2.5 ${
                      isExpanded ? 'px-3.5 gap-3.5' : 'pl-3 pr-0 gap-0'
                    } ${
                      isActive 
                        ? 'active-nav-tab' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-xl'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <FolderOpen className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`} />
                      {isExpanded && <span className="text-xs font-bold font-sans">Projects</span>}
                    </>
                  )}
                </NavLink>

                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => 
                    `w-full flex items-center transition-all duration-200 relative py-2.5 ${
                      isExpanded ? 'px-3.5 gap-3.5' : 'pl-3 pr-0 gap-0'
                    } ${
                      isActive 
                        ? 'active-nav-tab' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-xl'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Users className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`} />
                      {isExpanded && <span className="text-xs font-bold font-sans">Team Status</span>}
                    </>
                  )}
                </NavLink>

                <NavLink 
                  to="/assign-task" 
                  className={({ isActive }) => 
                    `w-full flex items-center transition-all duration-200 relative py-2.5 ${
                      isExpanded ? 'px-3.5 gap-3.5' : 'pl-3 pr-0 gap-0'
                    } ${
                      isActive 
                        ? 'active-nav-tab' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-xl'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <PlusCircle className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`} />
                      {isExpanded && <span className="text-xs font-bold font-sans">Assign Task</span>}
                    </>
                  )}
                </NavLink>

                <NavLink 
                  to="/ranking" 
                  className={({ isActive }) => 
                    `w-full flex items-center transition-all duration-200 relative py-2.5 ${
                      isExpanded ? 'px-3.5 gap-3.5' : 'pl-3 pr-0 gap-0'
                    } ${
                      isActive 
                        ? 'active-nav-tab' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-xl'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Award className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`} />
                      {isExpanded && <span className="text-xs font-bold font-sans">Rankings</span>}
                    </>
                  )}
                </NavLink>

                <NavLink 
                  to="/analytics" 
                  className={({ isActive }) => 
                    `w-full flex items-center transition-all duration-200 relative py-2.5 ${
                      isExpanded ? 'px-3.5 gap-3.5' : 'pl-3 pr-0 gap-0'
                    } ${
                      isActive 
                        ? 'active-nav-tab' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-xl'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <TrendingUp className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`} />
                      {isExpanded && <span className="text-xs font-bold font-sans">Analytics</span>}
                    </>
                  )}
                </NavLink>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom: User avatar & Logout */}
        <div className="flex flex-col items-center px-3 w-full">
          <div className="w-4/5 h-[1px] bg-slate-200/60 my-4" />
          
          <div 
            onClick={handleLogout}
            className="flex items-center w-full rounded-xl hover:bg-red-500/10 text-slate-600 hover:text-red-700 px-3.5 py-2.5 gap-3.5 transition-all cursor-pointer"
            title="Sign out of account"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-500" />
            {isExpanded && <span className="text-xs font-bold font-sans">Sign Out</span>}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog inside Sidebar portal */}
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

export default Sidebar;
