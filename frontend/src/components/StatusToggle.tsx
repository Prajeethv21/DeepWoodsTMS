import React from 'react';

interface StatusToggleProps {
  status: 'Yet to Start' | 'In Progress' | 'Done' | 'Overdue' | string;
  onChange?: (newStatus: 'Yet to Start' | 'In Progress' | 'Done' | 'Overdue') => void;
  readOnly?: boolean;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ status, onChange, readOnly = false }) => {
  const states: ('Yet to Start' | 'In Progress' | 'Done')[] = ['Yet to Start', 'In Progress', 'Done'];

  const getStyleClasses = (state: string) => {
    switch (state) {
      case 'Yet to Start':
        return {
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          activeBtn: 'bg-slate-200 text-slate-800 border-slate-300'
        };
      case 'In Progress':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-600',
          activeBtn: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      case 'Done':
        return {
          badge: 'bg-green-100 text-green-800 border-green-200',
          dot: 'bg-green-600',
          activeBtn: 'bg-green-100 text-green-800 border-green-300'
        };
      case 'Overdue':
      default:
        return {
          badge: 'bg-red-100 text-red-800 border-red-200',
          dot: 'bg-red-600',
          activeBtn: 'bg-red-100 text-red-800 border-red-300'
        };
    }
  };

  const style = getStyleClasses(status);

  if (readOnly) {
    return (
      <div className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${style.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`} />
        {status}
      </div>
    );
  }

  return (
    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 w-full max-w-sm">
      {states.map(state => {
        const isActive = status === state;
        const buttonStyle = getStyleClasses(state);
        
        return (
          <button
            key={state}
            type="button"
            onClick={() => onChange && onChange(state as any)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[9.5px] font-extrabold transition-all cursor-pointer ${
              isActive 
                ? `${buttonStyle.activeBtn} border shadow-sm` 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent'
            }`}
          >
            {state}
          </button>
        );
      })}
    </div>
  );
};

export default StatusToggle;
