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
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && login) {
      await login(email.trim().toLowerCase());
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
                await login(response.credential);
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
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-white relative overflow-hidden select-none">
      
      {/* ========================================================
          LEFT PANEL: Soft Green Illustration Panel (~50% width)
          ======================================================== */}
      <div className="w-full md:w-1/2 bg-[#EAF8EE] flex flex-col justify-center items-center p-8 md:p-12 min-h-[50vh] md:min-h-screen">
        <div className="flex flex-col items-center max-w-[420px] text-center">
          <img 
            src={loginIllustration} 
            alt="Deepwoods Login Illustration" 
            className="w-[85%] max-w-[320px] object-contain mb-10 transition-transform duration-500 hover:scale-[1.01]" 
          />
          
          <h2 className="text-xl font-bold text-slate-800 mb-2 font-sans tracking-tight">
            Deepwoods Task Manager
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans px-6 mb-8">
            Organize your projects, cultivate your focus, and nurture team collaboration all in one place.
          </p>
          
          {/* Custom Carousel Dots styling matching the reference image layout */}
          <div className="flex gap-2 items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-200/40" />
            <span className="w-5 h-2 rounded-full bg-brand-primary" />
            <span className="w-2 h-2 rounded-full bg-emerald-200/40" />
            <span className="w-2 h-2 rounded-full bg-emerald-200/40" />
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT PANEL: White Form Panel (~50% width)
          ======================================================== */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 md:p-12 min-h-[50vh] md:min-h-screen">
        <div className="w-full max-w-[320px] flex flex-col">
          
          {/* Brand Logo at top */}
          <div className="flex flex-col items-center mb-10">
            <img 
              src="/DeepwoodsR.png" 
              alt="Deepwoods Logo" 
              className="h-[54px] w-auto object-contain shrink-0 select-none" 
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col">
            
            {/* Email Field */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans">
                Username or email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="johnsmith007"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 placeholder-slate-300 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-sans font-medium"
                required
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer font-sans"
            >
              {loading ? 'Verifying...' : 'Sign in'}
            </button>
          </form>

          {/* Separator OR */}
          <div className="flex items-center gap-3 my-6 w-full">
            <div className="flex-1 h-[1px] bg-slate-200/50" />
            <span className="text-[10px] text-slate-400 font-bold tracking-wider font-sans">or</span>
            <div className="flex-1 h-[1px] bg-slate-200/50" />
          </div>

          {/* Google Sign In Button Container / Fallback */}
          {googleClientId ? (
            <div id="google-signin-button" className="w-full flex justify-center py-1 min-h-[46px] transition-all hover:opacity-95" />
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google logo" 
                className="w-4 h-4 shrink-0" 
              />
              <span className="font-sans font-bold text-slate-500">Sign in with Google</span>
            </button>
          )}

          {/* Sign Up footer link */}
          <div className="text-center mt-8 text-[11px] font-semibold text-slate-400 font-sans">
            Are you new?{' '}
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()} 
              className="text-brand-primary font-bold hover:underline"
            >
              Create an Account
            </a>
          </div>

          {/* Global Error Notice */}
          {error && (
            <div className="mt-5 w-full bg-red-50 border border-red-100/60 text-red-700 p-3 rounded-xl text-[10.5px] font-bold text-center leading-relaxed font-sans shadow-sm animate-shake">
              {error}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
