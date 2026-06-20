import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { RefreshCw, Users, CheckCircle, Clock, AlertTriangle, FileText, HelpCircle } from 'lucide-react';

// ===== STATUS PILL =====
interface StatusPillProps {
  status: 'On Track' | 'At Risk' | 'Overdue' | string;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const getStyleClasses = () => {
    switch (status) {
      case 'On Track':
        return 'bg-green-50 text-green-700 border-green-100/80';
      case 'At Risk':
        return 'bg-amber-50 text-amber-700 border-amber-100/80';
      case 'Overdue':
      default:
        return 'bg-red-50 text-red-700 border-red-100/80';
    }
  };

  const getDotClass = () => {
    switch (status) {
      case 'On Track':
        return 'bg-green-500';
      case 'At Risk':
        return 'bg-amber-500';
      case 'Overdue':
      default:
        return 'bg-red-500';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold font-jakarta tracking-wide ${getStyleClasses()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotClass()}`} />
      {status}
    </div>
  );
};

// ===== MINI PROGRESS BAR =====
interface MiniBarProps {
  value: number;
}

const MiniBar: React.FC<MiniBarProps> = ({ value }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
        <div 
          className="h-full bg-brand-primary rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-slate-500 min-w-[28px] text-right font-sans">{value}%</span>
    </div>
  );
};

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

export const AdminDashboard: React.FC = () => {
  const auth = useAuth();
  const user = auth.user;

  const {
    fetchDashboardData,
    runCarryForward,
    runProvisionDatabase,
    kpis,
    projects,
    teamStatus,
    loading,
    carryForwardLoading,
    error
  } = useDashboard();

  const totalTasksAdmin = (kpis?.completedTasks ?? 0) + (kpis?.pendingTasks ?? 0) + (kpis?.overdueTasks ?? 0);
  const completionRate = kpis?.completionRate ?? 0;
  const pendingRate = totalTasksAdmin > 0 ? Math.round(((kpis?.pendingTasks ?? 0) / totalTasksAdmin) * 100) : 0;
  const overdueRate = totalTasksAdmin > 0 ? Math.round(((kpis?.overdueTasks ?? 0) / totalTasksAdmin) * 100) : 0;
  const activeProjectsCount = projects.filter((p: any) => p.status === 'Active').length;
  const totalProjectsCount = kpis?.totalProjects ?? 0;
  const projectsRate = totalProjectsCount > 0 ? Math.round((activeProjectsCount / totalProjectsCount) * 100) : 0;

  const searchQuery = auth.searchQuery || '';

  const filteredTeamStatus = React.useMemo(() => {
    if (!searchQuery.trim()) return teamStatus;
    const lower = searchQuery.toLowerCase();
    return teamStatus.filter(m => 
      m.name.toLowerCase().includes(lower) ||
      m.role.toLowerCase().includes(lower) ||
      m.email.toLowerCase().includes(lower) ||
      (m.todayTask && m.todayTask.toLowerCase().includes(lower)) ||
      (m.todayProject && m.todayProject.toLowerCase().includes(lower))
    );
  }, [teamStatus, searchQuery]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    if (user?.email) {
      fetchDashboardData(user.email);
    }
  }, [user?.email, fetchDashboardData]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error]);

  const handleRefresh = () => {
    if (user?.email) {
      fetchDashboardData(user.email);
      showToast("Dashboard stats refreshed.", 'success');
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const handleCarryForward = async () => {
    if (!user?.email) return;
    try {
      showToast("Triggering carry-forward process...", 'info');
      const result = await runCarryForward(user.email);
      if (result.carriedCount === 0) {
        showToast("Carry Forward completed. No uncompleted past tasks found to copy.", 'info');
      } else {
        showToast(`Success! Carried forward ${result.carriedCount} uncompleted tasks.`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || "Failed to trigger carry forward.", 'error');
    }
  };

  const handleProvisionDatabase = async () => {
    if (!user?.email) return;
    try {
      showToast("Provisioning database structures...", 'info');
      const result = await runProvisionDatabase(user.email);
      showToast(result.message || "Database sheets successfully provisioned.", 'success');
    } catch (err: any) {
      showToast(err.message || "Failed to provision database sheets.", 'error');
    }
  };

  const handleReviewOverdue = () => {
    const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID;
    if (sheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`, '_blank');
      showToast("Opening spreadsheet in a new tab...", 'success');
    } else {
      showToast("Google Sheet ID is not configured in environment.", 'error');
    }
  };

  const handleExportReport = () => {
    if (!teamStatus || teamStatus.length === 0) {
      showToast("No team status data available to export.", 'error');
      return;
    }

    const headers = [
      "Name", "Email", "Role", "Today's Project", "Today's Project Type",
      "Today's Task", "Today's Status", "Last Updated", "Total Assigned",
      "Completed", "Pending", "Overdue"
    ];

    const csvRows = [headers.join(",")];

    for (const m of teamStatus) {
      const values = [
        `"${m.name.replace(/"/g, '""')}"`,
        `"${m.email.replace(/"/g, '""')}"`,
        `"${m.role.replace(/"/g, '""')}"`,
        `"${(m.todayProject || '-').replace(/"/g, '""')}"`,
        `"${(m.todayType || '-').replace(/"/g, '""')}"`,
        `"${(m.todayTask || '-').replace(/"/g, '""')}"`,
        `"${(m.todayStatus || '-').replace(/"/g, '""')}"`,
        `"${(m.lastUpdated || '-').replace(/"/g, '""')}"`,
        m.totalAssigned,
        m.doneCount,
        m.pendingCount,
        m.overdueCount
      ];
      csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `deepwoods_team_overview_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Successfully exported team overview report to CSV.", 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      <Header />

      <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative">
        {/* Toast Notification */}
        {toastMsg && (
          <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg(null)} />
        )}

        {/* ===== PAGE TITLE ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase font-sans">
                ADMIN CONSOLE
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Team Overview
            </h1>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <FileText className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Export Report</span>
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-primary text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''} shrink-0`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        {/* ===== KPI CARDS (Redesigned to match premium Layout/Accent guidelines) ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Projects */}
          <div className="premium-card py-5 px-5 h-[128px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(25,118,210,0.15)] transition-all duration-300 ease-out">
            <div className="flex justify-between items-start w-full">
              <Users className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <MiniProgressRing value={projectsRate} colorClass="stroke-[#1976D2]" />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                TOTAL PROJECTS
              </span>
              <h2 className="text-[34px] font-bold text-slate-800 tracking-tight leading-none">
                {totalProjectsCount}
              </h2>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#1976D2] to-[#115293]" />
          </div>

          {/* Card 2: Completed Tasks */}
          <div className="premium-card py-5 px-5 h-[128px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(146,193,62,0.15)] transition-all duration-300 ease-out">
            <div className="flex justify-between items-start w-full">
              <CheckCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <MiniProgressRing value={completionRate} colorClass="stroke-[#92c13e]" />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                COMPLETED TASKS
              </span>
              <h2 className="text-[34px] font-bold text-[#92c13e] tracking-tight leading-none">
                {kpis?.completedTasks ?? 0}
              </h2>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#92c13e] to-[#7fa82f]" />
          </div>

          {/* Card 3: In Progress Tasks */}
          <div className="premium-card py-5 px-5 h-[128px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,160,0,0.15)] transition-all duration-300 ease-out">
            <div className="flex justify-between items-start w-full">
              <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <MiniProgressRing value={pendingRate} colorClass="stroke-[#FFA000]" />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                IN PROGRESS
              </span>
              <h2 className="text-[34px] font-bold text-[#FFA000] tracking-tight leading-none">
                {kpis?.pendingTasks ?? 0}
              </h2>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#FFA000] to-[#E68A00]" />
          </div>

          {/* Card 4: Overdue Tasks */}
          <div className="premium-card py-5 px-5 h-[128px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,151,167,0.15)] transition-all duration-300 ease-out">
            <div className="flex justify-between items-start w-full">
              <AlertTriangle className="w-5 h-5 text-[#0097A7] shrink-0 mt-0.5" />
              <MiniProgressRing value={overdueRate} colorClass="stroke-[#0097A7]" />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                OVERDUE TASKS
              </span>
              <h2 className="text-[34px] font-bold text-[#0097A7] tracking-tight leading-none">
                {kpis?.overdueTasks ?? 0}
              </h2>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#0097A7] to-[#006064]" />
          </div>
        </div>

        {/* ===== Team Member Status Table ===== */}
        <div className="mb-6 bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <div className="p-4 px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
            <div>
              <h3 className="text-xs font-black text-slate-800 font-sans uppercase tracking-wider">Team Member Status</h3>
              <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-sans uppercase">
                Daily Workspace Logs
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium font-sans">Loading team logs...</p>
            </div>
          ) : teamStatus.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs italic font-medium">
              No team configurations found in team_config.
            </div>
          ) : filteredTeamStatus.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs font-bold font-sans">
              No team members match your search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider font-sans text-[9px]">
                    <th className="p-3.5 pl-6">MEMBER</th>
                    <th className="p-3.5">TODAY'S TASK</th>
                    <th className="p-3.5">COMPLETED</th>
                    <th className="p-3.5">PENDING</th>
                    <th className="p-3.5">SCORE</th>
                    <th className="p-3.5 pr-6">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeamStatus.map((m) => {
                    const score = m.totalAssigned > 0 ? Math.round((m.doneCount / m.totalAssigned) * 100) : 0;
                    
                    let statusLabel = 'On Track';
                    if (m.rowHighlight === 'red') statusLabel = 'Overdue';
                    if (m.rowHighlight === 'yellow') statusLabel = 'At Risk';

                    return (
                      <tr 
                        key={m.email}
                        className="hover:bg-slate-50/40 transition-colors duration-150"
                      >
                        <td className="p-3.5 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-brand-primary/8 text-brand-primary flex items-center justify-center font-black text-[9.5px] border border-brand-primary/10 shrink-0 uppercase font-sans">
                              {m.name ? m.name.charAt(0) : 'P'}
                            </div>
                            <div>
                              <div className="font-black text-slate-800 leading-snug font-sans">{m.name}</div>
                              <div className="text-slate-400 text-[9.5px] font-bold font-sans">{m.role}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 max-w-[200px]">
                          {m.todayTask === 'No tasks assigned today' ? (
                            <span className="text-slate-400/80 italic text-[11px] font-medium font-sans">No tasks today</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                m.todayStatus === 'Done' ? 'bg-[#92c13e]' : (m.todayStatus === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300')
                              }`} />
                              <span className="text-slate-700 font-bold leading-snug truncate" title={m.todayTask}>
                                {m.todayTask}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-800 font-black text-sm font-sans">
                          {m.doneCount}
                        </td>

                        <td className="p-3.5 text-slate-800 font-black text-sm font-sans">
                          {m.pendingCount}
                        </td>

                        <td className="p-3.5 min-w-[120px]">
                          <MiniBar value={score} />
                        </td>

                        <td className="p-3.5 pr-6">
                          <StatusPill status={statusLabel} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== QUICK ACTIONS PANEL (Lower section) ===== */}
        <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4 font-sans">
            Operations Controls
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCarryForward}
              disabled={carryForwardLoading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-emerald-950 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-sm active:scale-95 font-sans"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carryForwardLoading ? 'animate-spin' : ''} shrink-0`} />
              <span>Trigger Carry Forward</span>
            </button>
            <button
              onClick={handleReviewOverdue}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 font-sans"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Review Overdue Sheet</span>
            </button>
            <button
              onClick={handleProvisionDatabase}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 font-sans"
            >
              <HelpCircle className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span>Provision Database</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
