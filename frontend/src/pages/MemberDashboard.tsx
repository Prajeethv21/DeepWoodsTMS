import React, { useEffect, useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useTasks from '../hooks/useTasks';
import Header from '../components/Header';
import TaskCard from '../components/TaskCard';
import { Calendar, CheckCircle2, AlertCircle, RefreshCw, ClipboardList, CheckCircle, Clock, LayoutGrid, Layers, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

// ===== MINI PROGRESS RING =====
interface MiniProgressRingProps {
  value: number;
  colorClass: string;
  trackColor?: string;
}

const MiniProgressRing: React.FC<MiniProgressRingProps> = ({ value, colorClass, trackColor = 'stroke-slate-100' }) => {
  const r = 11;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="relative w-9 h-9 flex items-center justify-center select-none shrink-0 mr-1">
      <svg className="w-9 h-9 transform -rotate-90" overflow="visible">
        <circle cx="18" cy="18" r={r} className={`${trackColor} fill-transparent`} strokeWidth="2.5" />
        <circle cx="18" cy="18" r={r} className={`${colorClass} fill-transparent transition-all duration-1000 ease-out`} strokeWidth="2.5" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute text-[9px] font-extrabold text-slate-700 leading-none">
        {Math.round(value)}%
      </div>
    </div>
  );
};

export const MemberDashboard: React.FC = () => {
  const auth = useAuth();
  const user = auth.user;

  const {
    todayTasks,
    historyTasks,
    loading,
    error,
    fetchTodayTasks,
    fetchHistory,
    updateStatus,
    updateRemarks
  } = useTasks();

  const [projectTypeFilter, setProjectTypeFilter] = useState<'All' | 'Internal' | 'External'>('All');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.email) {
      fetchTodayTasks(user.email);
      fetchHistory(user.email); // Pre-load all history to filter dates locally in calendar
    }
  }, [user?.email, fetchTodayTasks, fetchHistory]);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchQuery = auth.searchQuery || '';

  const selectedDateStr = React.useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const isTodaySelected = React.useMemo(() => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  }, [selectedDate]);

  // Determine checklist source based on selected date
  const currentChecklistTasks = React.useMemo(() => {
    if (isTodaySelected) {
      return todayTasks;
    }
    // Filter from history tasks list for custom date
    const filtered: Record<string, typeof todayTasks[string]> = {};
    historyTasks.forEach(task => {
      if (task.date === selectedDateStr) {
        const proj = task.projectRef || 'Unassigned';
        if (!filtered[proj]) {
          filtered[proj] = [];
        }
        filtered[proj].push(task);
      }
    });
    return filtered;
  }, [isTodaySelected, todayTasks, historyTasks, selectedDateStr]);

  const filteredTodayTasks = React.useMemo(() => {
    const result: Record<string, typeof todayTasks[string]> = {};
    const lowerQuery = searchQuery.trim().toLowerCase();

    Object.keys(currentChecklistTasks).forEach(projRef => {
      const tasks = currentChecklistTasks[projRef] || [];
      const isInternal = projRef.startsWith('DTM') || projRef.toLowerCase().includes('int') || projRef.toLowerCase().includes('ops');
      
      // Filter by project type
      if (projectTypeFilter === 'Internal' && !isInternal) return;
      if (projectTypeFilter === 'External' && isInternal) return;

      // Filter by search query
      const matchingTasks = lowerQuery
        ? tasks.filter(t => 
            t.taskTitle.toLowerCase().includes(lowerQuery) ||
            (t.taskDescription && t.taskDescription.toLowerCase().includes(lowerQuery)) ||
            t.taskId.toLowerCase().includes(lowerQuery) ||
            t.projectRef.toLowerCase().includes(lowerQuery) ||
            (t.remarks && t.remarks.toLowerCase().includes(lowerQuery))
          )
        : tasks;

      if (matchingTasks.length > 0) {
        result[projRef] = matchingTasks;
      }
    });
    return result;
  }, [currentChecklistTasks, searchQuery, projectTypeFilter]);

  const todayText = selectedDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const allTasksList = Object.values(currentChecklistTasks).flat();
  const totalTasks = allTasksList.length;
  const doneTasks = allTasksList.filter(t => t.status === 'Done').length;
  const pendingTasks = totalTasks - doneTasks;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Project-wise progress summaries for the sidebar
  const projectSummaries = React.useMemo(() => {
    return Object.keys(currentChecklistTasks).map(projectRef => {
      const tasks = currentChecklistTasks[projectRef] || [];
      const done = tasks.filter(t => t.status === 'Done').length;
      const total = tasks.length;
      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
      const isInternal = projectRef.startsWith('DTM') || projectRef.toLowerCase().includes('int') || projectRef.toLowerCase().includes('ops');
      return { projectRef, done, total, percentage, isInternal };
    });
  }, [currentChecklistTasks]);

  const handleRefresh = () => {
    if (user?.email) {
      fetchTodayTasks(user.email);
      fetchHistory(user.email);
    }
  };

  // Unused progress calculations removed

  // Build Calendar Days
  const calendarDays = React.useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDaysTotal = new Date(year, month, 0).getDate();

    const list = [];

    // Fill previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      list.push({
        dayNum: prevMonthDaysTotal - i,
        monthOffset: -1,
        dateObj: new Date(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, prevMonthDaysTotal - i)
      });
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      list.push({
        dayNum: i,
        monthOffset: 0,
        dateObj: new Date(year, month, i)
      });
    }

    // Fill next month days to align to grid
    const remaining = 42 - list.length;
    for (let i = 1; i <= remaining; i++) {
      list.push({
        dayNum: i,
        monthOffset: 1,
        dateObj: new Date(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, i)
      });
    }

    return list;
  }, [calendarViewDate]);

  // Calendar Day Task Status check
  const getDayStatus = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dayStr = `${y}-${m}-${d}`;

    // Filter tasks for this day from history
    const dayTasks = historyTasks.filter(t => t.date === dayStr);
    if (dayTasks.length === 0) return 'empty';
    
    const allDone = dayTasks.every(t => t.status === 'Done');
    return allDone ? 'completed' : 'pending';
  };

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      <Header />

      <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative">
        
        {/* Title, Date and Calendar Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase font-sans">
                DAILY WORKSPACE
              </span>
            </div>
            
            {/* Title stacked with Calendar Popover trigger */}
            <div className="flex items-center gap-2 relative">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-sans">
                {isTodaySelected ? "Today's Checklist" : "Calendar Checklist"}
              </h1>
              
              <button 
                onClick={() => {
                  setShowCalendar(!showCalendar);
                  setCalendarViewDate(new Date(selectedDate));
                }}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-brand-primary hover:border-brand-primary/40 shadow-sm transition-all cursor-pointer"
                title="Open Calendar Date Picker"
              >
                <Calendar className="w-4 h-4" />
              </button>

              {/* Popover Calendar Widget Styled EXACTLY like Image 2 */}
              {showCalendar && (
                <div 
                  ref={calendarRef}
                  className="absolute left-0 top-full mt-2 bg-white border border-slate-200/60 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-50 w-[240px] animate-scaleUp select-none"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-black text-slate-800 font-sans">
                      {calendarViewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={handlePrevMonth}
                        className="w-5 h-5 rounded-md hover:bg-slate-50 border border-slate-100 flex items-center justify-center cursor-pointer text-slate-600"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={handleNextMonth}
                        className="w-5 h-5 rounded-md hover:bg-slate-50 border border-slate-100 flex items-center justify-center cursor-pointer text-slate-600"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Weekdays */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 mb-2 font-sans">
                    <span>S</span>
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {calendarDays.map((day, idx) => {
                      const dayStatus = getDayStatus(day.dateObj);
                      const isSelected = 
                        day.dateObj.getDate() === selectedDate.getDate() &&
                        day.dateObj.getMonth() === selectedDate.getMonth() &&
                        day.dateObj.getFullYear() === selectedDate.getFullYear();
                        
                      const isTodayDay = 
                        day.dateObj.getDate() === new Date().getDate() &&
                        day.dateObj.getMonth() === new Date().getMonth() &&
                        day.dateObj.getFullYear() === new Date().getFullYear();

                      // Highlight styles
                      let styleClasses = 'text-slate-700 hover:bg-slate-50';
                      if (day.monthOffset !== 0) {
                        styleClasses = 'text-slate-300 pointer-events-none';
                      } else if (dayStatus === 'completed') {
                        // Green highlight for completed tasks
                        styleClasses = 'bg-[#92c13e]/20 text-[#0b2416] border border-[#92c13e]/30 font-bold';
                      } else if (dayStatus === 'pending') {
                        // Pink/red highlight for pending tasks
                        styleClasses = 'bg-rose-100 text-rose-800 border border-rose-200 font-bold';
                      }

                      if (isSelected) {
                        // Blue/emerald outline for active select
                        styleClasses += ' ring-2 ring-brand-primary ring-offset-1 scale-105';
                      }
                      
                      if (isTodayDay && day.monthOffset === 0 && !isSelected) {
                        styleClasses += ' border border-slate-400';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (day.monthOffset === 0) {
                              setSelectedDate(day.dateObj);
                              setShowCalendar(false);
                            }
                          }}
                          disabled={day.monthOffset !== 0}
                          className={`w-6 h-6 rounded-full text-[9.5px] font-black flex items-center justify-center transition-all cursor-pointer ${styleClasses}`}
                        >
                          {day.dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5 font-sans">
              <Calendar className="w-3.5 h-3.5 text-brand-primary" />
              {todayText}
              {!isTodaySelected && (
                <button 
                  onClick={() => setSelectedDate(new Date())}
                  className="text-[9px] text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-1.5 py-0.2 rounded hover:bg-brand-primary/20 transition-all font-black uppercase font-sans cursor-pointer ml-2"
                >
                  Back to Today
                </button>
              )}
            </p>
          </div>

          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 self-start md:self-auto px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Schedule</span>
          </button>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-start gap-3 text-xs mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <div>
              <h4 className="font-bold mb-0.5">Database Sync Alert</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Grid (Metrics matching custom stat layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Assigned Tasks */}
          <div className="premium-card py-5 px-5 h-[128px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(25,118,210,0.15)] transition-all duration-300 ease-out">
            <div className="flex justify-between items-start w-full">
              <ClipboardList className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <MiniProgressRing value={pct} colorClass="stroke-[#1976D2]" />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                ASSIGNED
              </span>
              <h2 className="text-[34px] font-bold text-slate-800 tracking-tight leading-none">
                {totalTasks}
              </h2>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#1976D2] to-[#115293]" />
          </div>

          {/* Card 2: Completed Tasks */}
          <div className="premium-card py-5 px-5 h-[128px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(146,193,62,0.15)] transition-all duration-300 ease-out">
            <div className="flex justify-between items-start w-full">
              <CheckCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <MiniProgressRing value={pct} colorClass="stroke-[#92c13e]" />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                COMPLETED
              </span>
              <h2 className="text-[34px] font-bold text-[#92c13e] tracking-tight leading-none">
                {doneTasks}
              </h2>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#92c13e] to-[#7fa82f]" />
          </div>

          {/* Card 3: Pending Tasks */}
          <div className="premium-card py-5 px-5 h-[128px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,160,0,0.15)] transition-all duration-300 ease-out">
            <div className="flex justify-between items-start w-full">
              <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <MiniProgressRing value={totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0} colorClass="stroke-[#FFA000]" />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                PENDING
              </span>
              <h2 className="text-[34px] font-bold text-[#FFA000] tracking-tight leading-none">
                {pendingTasks}
              </h2>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#FFA000] to-[#E68A00]" />
          </div>

          {/* Card 4: Day Progress */}
          <div className="premium-card py-5 px-5 h-[128px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,151,167,0.15)] transition-all duration-300 ease-out">
            <div className="flex justify-between items-start w-full">
              <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <MiniProgressRing value={pct} colorClass="stroke-[#0097A7]" />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                DAY PROGRESS
              </span>
              <h2 className="text-[34px] font-bold text-slate-800 tracking-tight leading-none">
                {doneTasks}/{totalTasks}
              </h2>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#0097A7] to-[#006064]" />
          </div>
        </div>

        {/* Project Classification Filters Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/50 p-1 rounded-xl w-fit mb-6 select-none shadow-sm">
          {[
            { id: 'All', label: 'All Projects', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
            { id: 'Internal', label: 'Internal Projects', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'External', label: 'Client Projects', icon: <Globe className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setProjectTypeFilter(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                projectTypeFilter === tab.id
                  ? 'bg-brand-primary text-emerald-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Grid: 2 Columns for Checklist & Sidebar breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Column: Tasks List */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 border border-slate-100 rounded-[28px]">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium font-sans">Loading checklist...</p>
              </div>
            ) : totalTasks === 0 ? (
              <div className="border border-slate-200 rounded-3xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-brand-primary/30 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 mb-1 font-sans">No tasks scheduled</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  There are no checklist tasks registered for this date. Check with your lead or select another day on the calendar.
                </p>
              </div>
            ) : Object.keys(filteredTodayTasks).length === 0 ? (
              <div className="border border-slate-100 rounded-[28px] p-12 text-center">
                <span className="text-3xl block mb-3 opacity-60">🔍</span>
                <h3 className="text-sm font-bold text-slate-800 mb-1 font-sans">No matching tasks found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  No tasks match your filter/search query. Try selecting another tab or typing a different search term.
                </p>
              </div>
            ) : (
              Object.keys(filteredTodayTasks).map((projectRef) => {
                const projectTasks = filteredTodayTasks[projectRef] || [];
                const isInternal = projectRef.startsWith('DTM') || projectRef.toLowerCase().includes('int') || projectRef.toLowerCase().includes('ops');
                
                return (
                  <div 
                    key={projectRef} 
                    className="border border-slate-100 rounded-[28px] overflow-hidden"
                  >
                    {/* Project Header block */}
                    <div className="py-3 px-5 border-b border-slate-100 flex items-center gap-2">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                        isInternal 
                          ? 'bg-slate-50 text-slate-500 border-slate-200/60' 
                          : 'bg-brand-primary/5 text-brand-primary border-brand-primary/10'
                      }`}>
                        {isInternal ? 'INTERNAL' : 'CLIENT'}
                      </span>
                      <span className="text-xs font-black text-slate-800 tracking-tight font-sans">
                        {projectRef}
                      </span>
                    </div>

                    {/* Task Card lists */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectTasks.map((task) => (
                        <TaskCard 
                          key={task.taskId} 
                          task={task} 
                          onStatusUpdate={updateStatus}
                          onRemarksUpdate={updateRemarks}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Project Progress Sidebar breakdown */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border border-slate-100 rounded-[28px] p-5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans mb-4">
                Project Breakdown
              </h3>
              
              {projectSummaries.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No project data today.</p>
              ) : (
                <div className="space-y-4">
                  {projectSummaries.map((summary) => (
                    <div key={summary.projectRef} className="pb-3.5 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-slate-800 tracking-tight truncate max-w-[120px] font-sans">
                          {summary.projectRef}
                        </span>
                        <span className={`text-[7.5px] font-black px-1.5 py-0.2 rounded border ${
                          summary.isInternal 
                            ? 'bg-slate-50 text-slate-500 border-slate-200/50' 
                            : 'bg-brand-primary/5 text-brand-primary border-brand-primary/10'
                        }`}>
                          {summary.isInternal ? 'INTERNAL' : 'CLIENT'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-bold mb-1.5 font-sans">
                        <span>{summary.done} / {summary.total} completed</span>
                        <span className="text-slate-600 font-extrabold">{summary.percentage}%</span>
                      </div>
                      
                      <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-200/20">
                        <div 
                          className="h-full bg-brand-primary rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${summary.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default MemberDashboard;
