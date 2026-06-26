import React, { useEffect, useState, useTransition } from 'react';
import useAuth from '../hooks/useAuth';
import useTasks from '../hooks/useTasks';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import StatusToggle from '../components/StatusToggle';
import { History } from 'lucide-react';

// Friendly date formatting helper
const formatDateFriendly = (dateStr: string) => {
  if (!dateStr) return '—';
  
  // Clean up timestamp time part if it exists (e.g. "2026-06-20 10:27:51" -> "2026-06-20")
  const justDate = dateStr.split(' ')[0];
  const parts = justDate.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${day} ${month} ${year}`;
};

export const TaskHistory: React.FC = () => {
  const auth = useAuth();
  const user = auth.user;

  const {
    historyTasks,
    projectFilters,
    loading,
    fetchHistory,
    fetchProjectFilters
  } = useTasks();

  const [projectSelect, setProjectSelect] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const { searchQuery, setSearchQuery } = auth;
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (user?.email) {
      fetchHistory(user.email, projectSelect);
      fetchProjectFilters(user.email);
    }
  }, [user?.email, projectSelect, fetchHistory, fetchProjectFilters]);

  // Extract unique years from task history dynamically
  const uniqueYears = React.useMemo(() => {
    const years = historyTasks.map(t => t.date.split('-')[0]).filter(Boolean);
    return [...new Set(years)].sort().reverse();
  }, [historyTasks]);

  const monthsList = [
    { value: '01', name: 'January' },
    { value: '02', name: 'February' },
    { value: '03', name: 'March' },
    { value: '04', name: 'April' },
    { value: '05', name: 'May' },
    { value: '06', name: 'June' },
    { value: '07', name: 'July' },
    { value: '08', name: 'August' },
    { value: '09', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  const getFilteredHistory = () => {
    let filtered = historyTasks;

    // Filter by search query
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.taskTitle.toLowerCase().includes(lower) ||
        (t.taskDescription && t.taskDescription.toLowerCase().includes(lower)) ||
        t.taskId.toLowerCase().includes(lower) ||
        t.projectRef.toLowerCase().includes(lower) ||
        (t.remarks && t.remarks.toLowerCase().includes(lower))
      );
    }

    // Filter by selected month
    if (selectedMonth) {
      filtered = filtered.filter(t => t.date.split('-')[1] === selectedMonth);
    }

    // Filter by selected year
    if (selectedYear) {
      filtered = filtered.filter(t => t.date.split('-')[0] === selectedYear);
    }

    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      <Header />

      <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative">
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase font-sans">
              ARCHIVE LOG
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-sans">
            Task History Log
          </h1>
        </div>

        {/* Filters Control Bar */}
        <div className="premium-card p-4 px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <SearchBar 
            value={searchQuery} 
            onChange={(val) => startTransition(() => setSearchQuery(val))} 
            placeholder="Search task logs, descriptions, remarks..." 
          />

          {/* Date, Year & Project filters */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Year select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 tracking-wide font-sans uppercase">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-brand-primary transition-all font-bold cursor-pointer font-sans"
              >
                <option value="">All Years</option>
                {uniqueYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Month select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 tracking-wide font-sans uppercase">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-brand-primary transition-all font-bold cursor-pointer font-sans"
              >
                <option value="">All Months</option>
                {monthsList.map(mo => (
                  <option key={mo.value} value={mo.value}>{mo.name}</option>
                ))}
              </select>
            </div>

            {/* Project select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 tracking-wide flex items-center gap-1 font-sans uppercase">
                <History className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                Project:
              </span>
              <select
                value={projectSelect}
                onChange={(e) => setProjectSelect(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-brand-primary transition-all font-bold cursor-pointer font-sans"
              >
                <option value="">All Projects</option>
                {projectFilters.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Archive Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 border border-slate-100 rounded-[28px]">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium font-sans">Loading history logs...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="border border-slate-100 rounded-[28px] p-16 text-center">
            <span className="text-3xl block mb-3 opacity-60">📂</span>
            <p className="text-xs text-slate-500 font-bold font-sans">
              No task history found matching these filters.
            </p>
          </div>
        ) : (
          <div className="border border-slate-100 rounded-[28px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[11px] md:text-xs">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider font-sans text-[9.5px]">
                    <th className="p-3.5 pl-6">DATE ASSIGNED</th>
                    <th className="p-3.5">PROJECT</th>
                    <th className="p-3.5 w-full">TASK DESCRIPTION</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5 pr-6">COMPLETED ON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((task) => (
                    <tr 
                      key={`${task.taskId}-${task.date}`} 
                      className="hover:bg-slate-50/40 transition-colors duration-150"
                    >
                      <td className="p-3.5 pl-6 whitespace-nowrap font-black text-slate-700 font-sans">
                        {formatDateFriendly(task.date)}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-brand-primary text-white border border-brand-primary/20 px-3 py-1.5 rounded-lg text-[10.5px] font-black font-sans shadow-sm tracking-wide inline-block">
                          {task.projectRef}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-normal break-words max-w-[500px]">
                        <div className="font-black text-slate-800 mb-1 leading-snug font-sans text-xs">
                          {task.taskTitle}
                        </div>
                        {task.taskDescription && (
                          <div className="text-slate-500 text-[10.5px] leading-relaxed font-sans font-medium whitespace-normal break-words">
                            {task.taskDescription}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <StatusToggle status={task.status} readOnly={true} />
                      </td>
                      <td className="p-3.5 pr-6 text-brand-primary whitespace-nowrap font-black font-sans">
                        {task.completedAt 
                          ? formatDateFriendly(task.completedAt) 
                          : (task.status === 'Done' ? formatDateFriendly(task.date) : '—')
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TaskHistory;
