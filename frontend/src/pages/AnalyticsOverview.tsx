import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import Header from '../components/Header';
import { Briefcase, Building, BarChart2, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AnalyticsOverview: React.FC = () => {
  const { user } = useAuth();
  const { fetchDashboardData, projects, teamStatus, kpis } = useDashboard();
  const [activeTab, setActiveTab] = useState<'external' | 'internal'>('external');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchDashboardData(user.email);
    }
  }, [user?.email, fetchDashboardData]);

  const extProjs = projects.filter(p => !p.isInternal);
  const intProjs = projects.filter(p => p.isInternal);

  const currentProjs = activeTab === 'external' ? extProjs : intProjs;
  const fallbackDone = currentProjs.reduce((acc, curr) => acc + (curr.doneTasks || 0), 0);
  const fallbackOverdue = currentProjs.reduce((acc, curr) => acc + (curr.overdueTasks || 0), 0);
  const fallbackPending = currentProjs.reduce((acc, curr) => acc + (curr.pendingTasks || 0), 0);
  const fallbackNonOverduePending = Math.max(0, fallbackPending - fallbackOverdue);
  const fallbackInProgress = Math.round(fallbackNonOverduePending * 0.5);
  const fallbackYetToStart = fallbackNonOverduePending - fallbackInProgress;

  const isKpiAvailable = kpis && typeof kpis.externalDone !== 'undefined' && kpis.externalDone !== null && (kpis.externalTotal !== 0 || kpis.internalTotal !== 0);

  const done = isKpiAvailable
    ? (activeTab === 'external' ? (kpis?.externalDone ?? 0) : (kpis?.internalDone ?? 0))
    : fallbackDone;
  const inProgress = isKpiAvailable
    ? (activeTab === 'external' ? (kpis?.externalInProgress ?? 0) : (kpis?.internalInProgress ?? 0))
    : fallbackInProgress;
  const yetToStart = isKpiAvailable
    ? (activeTab === 'external' ? (kpis?.externalYetToStart ?? 0) : (kpis?.internalYetToStart ?? 0))
    : fallbackYetToStart;
  const overdue = isKpiAvailable
    ? (activeTab === 'external' ? (kpis?.externalOverdue ?? 0) : (kpis?.internalOverdue ?? 0))
    : fallbackOverdue;
  const total = done + inProgress + yetToStart + overdue;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const pendingRate = total > 0 ? Math.round(((inProgress + yetToStart) / total) * 100) : 0;

  // Donut chart calculations
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~282.7

  const doneLen = total > 0 ? (done / total) * circumference : 0;
  const inProgLen = total > 0 ? (inProgress / total) * circumference : 0;
  const yetToStartLen = total > 0 ? (yetToStart / total) * circumference : 0;
  const overdueLen = total > 0 ? (overdue / total) * circumference : 0;

  const doneOffset = 0;
  const inProgOffset = -doneLen;
  const yetToStartOffset = -(doneLen + inProgLen);
  const overdueOffset = -(doneLen + inProgLen + yetToStartLen);

  // Productivity Bars based on activeTab completed tasks count
  interface ChartMember {
    name: string;
    email: string;
    done: number;
  }
  let chartMembers: ChartMember[] = [];
  if (teamStatus && teamStatus.length > 0) {
    const mapped = teamStatus.map(m => {
      const hasSplits = typeof m.externalDone !== 'undefined' && m.externalDone !== null && (m.externalAssigned !== 0 || m.internalAssigned !== 0);
      let doneVal = hasSplits
        ? (activeTab === 'external' ? (m.externalDone ?? 0) : (m.internalDone ?? 0))
        : (activeTab === 'external' ? Math.round(m.doneCount * 0.6) : Math.round(m.doneCount * 0.4));
      return {
        name: m.name ? m.name.split(' ')[0] : 'Member',
        email: m.email,
        done: doneVal
      };
    });
    // Sort by done descending
    const sorted = [...mapped].sort((a, b) => b.done - a.done);
    chartMembers = sorted.slice(0, 8);
  }

  const maxDoneValue = Math.max(...chartMembers.map(m => m.done), 10);
  const getBarHeight = (doneCount: number) => {
    return `${(doneCount / maxDoneValue) * 100}%`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      <Header />

      <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative">
        
        {/* Title and selector bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Analytics Dashboard
            </h1>
          </div>

          {/* Project toggle styled as light modern tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 border border-slate-200/40 p-1 rounded-xl w-fit shadow-sm">
            <button
              onClick={() => setActiveTab('external')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'external'
                  ? 'bg-brand-primary text-white shadow-sm font-sans'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Client Projects</span>
            </button>
            <button
              onClick={() => setActiveTab('internal')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'internal'
                  ? 'bg-brand-primary text-white shadow-sm font-sans'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Internal Projects</span>
            </button>
          </div>
        </div>

        {/* 2 Column Grid for Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* ========================================================
              CARD 1: Milestones Completion Rates
              ======================================================== */}
          <div className="bg-white border border-slate-100/80 p-6 rounded-[24px] flex flex-col justify-between shadow-premium relative overflow-hidden h-[240px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider font-sans">Task Completion rates</h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-black font-sans uppercase">Live</span>
            </div>

            <div className="space-y-4">
              {/* Progress 1: Done Tasks */}
              <div>
                <div className="flex justify-between items-end mb-1 text-xs font-sans">
                  <span className="text-slate-600 font-bold">Done Tasks</span>
                  <span className="text-slate-900 font-black text-sm">{completionRate}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2d6a4f] to-[#40916c] rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Progress 2: Pending Tasks */}
              <div>
                <div className="flex justify-between items-end mb-1 text-xs font-sans">
                  <span className="text-slate-600 font-bold">Active / In Progress</span>
                  <span className="text-slate-900 font-black text-sm">{pendingRate}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-455 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${pendingRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-2 font-sans border-t border-slate-100 pt-2">
              <span>Completed: {done}</span>
              <span>Pending: {inProgress + yetToStart}</span>
              <span>Overdue: {overdue}</span>
            </div>
          </div>

          {/* ========================================================
              CARD 2: Donut Status Breakdown
              ======================================================== */}
          <div className="bg-white border border-slate-100/80 p-6 rounded-[24px] flex flex-col justify-between shadow-premium h-[240px]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider font-sans">
                  Status Allocation
                </h3>
                <PieChart className="w-4 h-4 text-brand-primary" />
              </div>
            </div>

            <div className="flex justify-center items-center my-1 relative">
              <svg width="110" height="110" viewBox="0 0 120 120" className="transform -rotate-90">
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth={strokeWidth} />
                
                {doneLen > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#2d6a4f" strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={doneOffset} strokeLinecap="round" />
                )}
                {inProgLen > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#d97706" strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={inProgOffset} strokeLinecap="round" />
                )}
                {yetToStartLen > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#94a3b8" strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={yetToStartOffset} strokeLinecap="round" />
                )}
                {overdueLen > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#dc2626" strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={overdueOffset} strokeLinecap="round" />
                )}
              </svg>

              <div className="absolute text-center select-none">
                <span className="text-[8px] text-slate-400 font-black block uppercase tracking-wider font-sans">Total</span>
                <span className="text-lg font-black text-slate-800 leading-none font-sans">{total}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px] font-bold text-slate-500 pt-2 border-t border-slate-100 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2d6a4f]" />
                <span>Done ({done})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                <span>Active ({inProgress})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#94a3b8]" />
                <span>Pending ({yetToStart})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                <span>Overdue ({overdue})</span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================
            ROW 2: Member Productivity Bar Chart (Brought back & styled Light)
            ======================================================== */}
        <div className="bg-white border border-slate-100/80 p-5 rounded-[24px] flex flex-col justify-between shadow-premium relative min-h-[280px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-black text-slate-500 font-sans uppercase tracking-wider">
                Member Productivity
              </h3>
              <BarChart2 className="w-4 h-4 text-brand-primary" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold block mb-4 uppercase tracking-wider font-sans">
              {activeTab === 'external' ? 'Client Tasks Done' : 'Internal Tasks Done'}
            </span>
          </div>

          {/* Redesigned Vertical Bar Chart Layout */}
          <div className="flex h-[160px] mt-2 w-full relative">
            {/* Dedicated Y-Axis Labels Column */}
            <div className="w-10 flex flex-col justify-between items-end pr-2.5 text-[9px] font-bold text-slate-400 font-sans select-none pb-5 h-full">
              <span>{Math.round(maxDoneValue)}</span>
              <span>{Math.round(maxDoneValue * 0.75)}</span>
              <span>{Math.round(maxDoneValue * 0.5)}</span>
              <span>{Math.round(maxDoneValue * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Chart Area Container with border-l and border-b outline */}
            <div className="flex-1 flex items-end justify-around border-l border-b border-slate-200 pb-1.5 relative h-full px-2">
              {/* Dashed grid lines inside the chart area container */}
              {[0.25, 0.5, 0.75].map((ratio, idx) => (
                <div 
                  key={idx}
                  className="absolute left-0 right-0 border-t border-dashed border-slate-100 pointer-events-none" 
                  style={{ bottom: `${ratio * 100}%` }}
                />
              ))}

              <AnimatePresence mode="wait">
                {chartMembers.map((member) => {
                  const isHovered = hoveredBar === member.email;
                  return (
                    <div 
                      key={member.email} 
                      className="flex flex-col items-center flex-1 min-w-[32px] max-w-[64px] relative z-10 mx-1"
                    >
                      {/* Tooltip on hover */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-3 bg-slate-800 p-2 py-1 rounded-[10px] text-[10px] font-black text-white z-20 whitespace-nowrap shadow-md font-sans"
                          >
                            <span>{member.name}</span>: {member.done} Done
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Bar itself */}
                      <div className="w-full h-24 flex items-end justify-center">
                        <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: getBarHeight(member.done) }}
                           transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                           onMouseEnter={() => setHoveredBar(member.email)}
                           onMouseLeave={() => setHoveredBar(null)}
                           className="w-8 rounded-t-lg cursor-pointer transition-all duration-300 bg-[#2d6a4f] hover:bg-[#40916c] shadow-sm relative overflow-hidden"
                        >
                          {/* Highlight overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/15" />
                        </motion.div>
                      </div>

                      {/* Label */}
                      <span className="text-[10px] font-bold text-slate-500 mt-2 truncate max-w-full text-center font-sans">
                        {member.name}
                      </span>
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default AnalyticsOverview;
