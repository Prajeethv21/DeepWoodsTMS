import React from 'react';

interface LogoProps {
  showVersion?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ showVersion = true }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* Company Logo */}
      <img src="/DeepwoodsR.png" alt="Deepwoods Green" className="h-[54px] md:h-[64px] w-auto object-contain shrink-0" />
      
      {showVersion && (
        <span className="text-[9px] font-bold text-brand-primary bg-brand-secondary border border-brand-primary/10 px-1.5 py-0.5 rounded self-center font-sans">
          DTM-V1
        </span>
      )}
    </div>
  );
};

export default Logo;
