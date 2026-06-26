import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import loginIllustration from '@/assets/login-illustration.png';

declare global {
  interface Window {
    google: any;
    gsiInitialized?: boolean;
  }
}

export const LoginPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const login = auth?.login;
  const loading = auth?.loading;
  const error = auth?.authError;

  const [email, setEmail] = useState('');
  const [loginType, setLoginType] = useState<'member' | 'admin'>(() => {
    const saved = localStorage.getItem('deepwoods_login_type');
    return (saved === 'admin' || saved === 'member') ? saved : 'member';
  });
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Use a ref to store current loginType so the Google GSI callback always accesses the fresh state
  const loginTypeRef = React.useRef(loginType);
  useEffect(() => {
    localStorage.setItem('deepwoods_login_type', loginType);
    loginTypeRef.current = loginType;
  }, [loginType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && login) {
      await login(email.trim().toLowerCase(), loginType);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    let intervalId: any;

    const tryInitGsi = () => {
      if (window.google?.accounts?.id) {
        clearInterval(intervalId);
        if (!window.gsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (login) {
                await login(response.credential, loginTypeRef.current);
              }
            },
          });
          window.gsiInitialized = true;
        }

        const btnElem = document.getElementById('google-signin-button');
        if (btnElem) {
          window.google.accounts.id.renderButton(btnElem, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'rectangular',
          });
        }
      }
    };

    intervalId = setInterval(tryInitGsi, 300);
    tryInitGsi();

    return () => clearInterval(intervalId);
  }, [login, googleClientId]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-[#F4F8F5] relative overflow-hidden select-none">
      
      {/* ========================================================
          LEFT PANEL: Dark Premium Panel with Illustration (~50% width)
          ======================================================== */}
      <div className="w-full md:w-1/2 bg-[#0A0E14] flex flex-col justify-center items-center p-8 md:p-12 min-h-[50vh] md:min-h-screen relative overflow-hidden">
        {/* Decorative circles to match reference image */}
        <div className="absolute right-0 bottom-0 w-[450px] h-[450px] rounded-full border-[32px] border-emerald-950/20 pointer-events-none translate-x-1/4 translate-y-1/4" />
        <div className="absolute right-10 bottom-10 w-[300px] h-[300px] rounded-full border-[16px] border-emerald-900/10 pointer-events-none translate-x-1/6 translate-y-1/6" />
        
        <div className="flex flex-col items-center max-w-[420px] text-center z-10">
          <img 
            src={loginIllustration} 
            alt="Deepwoods Login Illustration" 
            className="w-[85%] max-w-[320px] object-contain mb-10 transition-transform duration-500 hover:scale-[1.01]" 
          />
          
          <h2 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">
            Deepwoods Task Manager
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed font-sans px-6 mb-8">
            Organize your projects, cultivate your focus, and nurture team collaboration all in one place.
          </p>
          
          {/* Custom Carousel Dots styling matching the reference image layout */}
          <div className="flex gap-2 items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-950/30" />
            <span className="w-5 h-2 rounded-full bg-[#92c13e]" />
            <span className="w-2 h-2 rounded-full bg-emerald-950/30" />
            <span className="w-2 h-2 rounded-full bg-emerald-950/30" />
          </div>
        </div>

        {/* Footer/Copyright at the bottom */}
        <div className="absolute bottom-8 left-8 md:left-12 text-[9px] font-semibold text-slate-600 font-sans tracking-wide z-10">
          © 2026 Deepwoods Green Initiatives. All rights reserved
        </div>
      </div>

      {/* ========================================================
          RIGHT PANEL: Light Green Form Panel (~50% width)
          ======================================================== */}
      <div className="w-full md:w-1/2 bg-[#F4F8F5] flex items-start justify-center pt-16 md:pt-24 p-8 md:p-12 min-h-[50vh] md:min-h-screen">
        <div className="w-full max-w-[360px] flex flex-col">
          
          {/* Brand Logo at top */}
          <div className="flex flex-col items-center mb-6">
            <img 
              src="/DeepwoodsR.png" 
              alt="Deepwoods Logo" 
              className="h-[80px] w-auto object-contain shrink-0 select-none mb-1.5" 
            />
            <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase font-sans">
              TASK MANAGER
            </span>
          </div>

          {/* Login Type Tabs */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6 select-none border border-slate-200/20">
            <button
              type="button"
              onClick={() => {
                setLoginType('member');
                auth?.setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                loginType === 'member'
                  ? 'bg-white text-[#0f172a] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                  : 'text-slate-500 hover:text-[#0f172a]'
              }`}
            >
              👥 Team Member
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('admin');
                auth?.setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                loginType === 'admin'
                  ? 'bg-[#0A0E14] text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
                  : 'text-slate-500 hover:text-[#0A0E14]'
              }`}
            >
              🛡️ Administrator
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col">
            
            {/* Email Field */}
            <div className="mb-6">
              <label className="block text-[12.5px] font-bold text-slate-500 mb-2 font-sans">
                {loginType === 'admin' ? 'Administrator Email' : 'Team Member Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={loginType === 'admin' ? 'admin@deepwoods.in' : 'member@deepwoods.in'}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[13.5px] text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#92c13e] focus:ring-2 focus:ring-[#92c13e]/20 transition-all font-sans font-semibold shadow-sm"
                required
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`w-full py-4 font-black text-sm rounded-xl shadow-sm transition-all active:scale-[0.98] duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer font-sans ${
                loginType === 'admin'
                  ? 'bg-[#0A0E14] hover:bg-slate-900 text-white'
                  : 'bg-[#92c13e] hover:bg-[#82b22e] text-emerald-950'
              }`}
            >
              {loading ? 'Verifying...' : `Sign In as ${loginType === 'admin' ? 'Admin' : 'Member'}`}
            </button>
          </form>

          {/* Separator OR */}
          <div className="flex items-center gap-3 my-6 w-full">
            <div className="flex-1 h-[1px] bg-slate-200/50" />
            <span className="text-[11px] text-slate-400 font-bold tracking-wider font-sans">or</span>
            <div className="flex-1 h-[1px] bg-slate-200/50" />
          </div>

          {/* Google Sign In Button Container / Fallback */}
          {googleClientId ? (
            <div id="google-signin-button" className="w-full flex justify-center py-1 min-h-[46px] transition-all hover:opacity-95" />
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] shadow-sm"
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google logo" 
                className="w-4 h-4 shrink-0" 
              />
              <span className="font-sans font-bold text-slate-500">Sign in with Google</span>
            </button>
          )}


          {/* Global Error Notice */}
          {error && (
            <div className="mt-5 w-full bg-red-50 border border-red-100/60 text-red-700 p-3.5 rounded-xl text-[11px] font-bold text-center leading-relaxed font-sans shadow-sm animate-shake">
              {error}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
