import React from 'react';

interface PriorityBadgeProps {
  priority: 'High' | 'Medium' | 'Low' | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getBadgeClasses = () => {
    const cleanPriority = String(priority).toLowerCase();
    switch (cleanPriority) {
      case 'high':
        return 'bg-red-50 text-red-600 border-red-100/80';
      case 'medium':
        return 'bg-amber-50/70 text-amber-750 border-amber-100/80';
      case 'low':
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getLabel = () => {
    const cleanPriority = String(priority).toLowerCase();
    if (cleanPriority === 'high') return 'High';
    if (cleanPriority === 'medium') return 'Medium';
    return 'Low';
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border font-jakarta tracking-wide ${getBadgeClasses()}`}>
      {getLabel()}
    </span>
  );
};

export default PriorityBadge;

