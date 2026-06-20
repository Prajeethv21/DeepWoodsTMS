import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Logo from '../components/Logo';
import { AlertOctagon, ArrowLeft } from 'lucide-react';

export const AccessDenied: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-slate-50 relative overflow-hidden p-6 text-slate-800">

      <div className="w-full max-w-[440px] bg-white border border-red-200 p-8 md:p-10 rounded-3xl shadow-md text-center flex flex-col items-center z-10 relative">
        <div className="mb-8">
          <Logo showVersion={true} />
        </div>

        <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-600 mb-6 shadow-sm">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-slate-900 mb-3">
          Access Denied
        </h2>
        
        <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-4">
          Your Google account is not registered in the Deepwoods Team Config database.
        </p>

        {user && user.email && (
          <div className="text-xs text-amber-800 font-mono bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 mb-6 w-full break-all font-bold">
            {user.email}
          </div>
        )}

        <p className="text-[11px] text-slate-400 mb-8 max-w-xs leading-normal font-medium">
          Please contact a system administrator or project manager to gain access to the platform.
        </p>

        <button
          onClick={handleReturn}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-transparent"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Sign-In</span>
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
