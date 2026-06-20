import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import Header from '../components/Header';
import { Briefcase, Building, Layers } from 'lucide-react';

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

// ===== TEAM AVATAR GROUP =====
interface AvatarGroupProps {
  initials?: string[];
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({ initials = [] }) => {
  return (
    <div className="flex items-center">
      {initials.slice(0, 3).map((letter, i) => (
        <div 
          key={i} 
          className="w-6 h-6 rounded-full bg-brand-primary/8 text-brand-primary flex items-center justify-center text-[10px] font-bold border border-brand-primary/10"
          style={{
            marginLeft: i > 0 ? '-6px' : '0',
            zIndex: initials.length - i
          }}
        >
          {letter}
        </div>
      ))}
    </div>
  );
};

// ===== SLIM PROGRESS BAR =====
interface ProgressBarProps {
  value: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  return (
    <div className="flex items-center gap-2.5 min-w-[120px]">
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

export const ProjectProgressCenter: React.FC = () => {
  const auth = useAuth();
  const user = auth.user;
  const { fetchDashboardData, projects } = useDashboard();
  const [activeTab, setActiveTab] = useState<'external' | 'internal'>('external');

  useEffect(() => {
    if (user?.email) fetchDashboardData(user.email);
  }, [user?.email, fetchDashboardData]);

  const searchQuery = auth.searchQuery || '';

  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const lower = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.projectName.toLowerCase().includes(lower) ||
      p.projectRef.toLowerCase().includes(lower) ||
      (p.owner && p.owner.toLowerCase().includes(lower))
    );
  }, [projects, searchQuery]);

  // Aggregate external stats
  const extProjects = filteredProjects.filter(p => !p.isInternal);
  const intProjects = filteredProjects.filter(p => p.isInternal);

  const getExternalStats = () => {
    const clients = extProjects.length;
    let completed = 0;
    let pending = 0;
    let overdue = 0;
    extProjects.forEach(p => {
      completed += p.doneTasks || 0;
      pending += p.pendingTasks || 0;
      overdue += p.overdueTasks || 0;
    });

    return {
      clients: clients,
      completed: completed,
      pending: pending,
      overdue: overdue
    };
  };

  const extStats = getExternalStats();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      <Header />

      <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative">
        {/* ===== PAGE HEADER ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                PORTFOLIO
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Project Center
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1 font-sans">
              Track project task burn-down, client health, and delivery timelines
            </p>
          </div>

          <div className="flex gap-2">
            <select defaultValue="2026" className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-primary transition-all font-bold cursor-pointer shadow-sm">
              <option>June 2026</option>
              <option>July 2026</option>
              <option>August 2026</option>
            </select>
          </div>
        </div>

        {/* ===== TAB PILLS ===== */}
        <div className="flex gap-2.5 mb-8">
          {[
            { id: 'external', label: 'Client Projects', count: extProjects.length, icon: <Briefcase className="w-3.5 h-3.5" /> },
            { id: 'internal', label: 'Internal Projects', count: intProjects.length, icon: <Building className="w-3.5 h-3.5" /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
                  isActive 
                    ? 'bg-brand-primary/10 border-brand-primary/20 text-slate-800' 
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-brand-primary' : 'text-slate-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ml-1 ${
                  isActive 
                    ? 'bg-brand-primary text-white' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== EXTERNAL TAB ===== */}
        {activeTab === 'external' && (
          <div className="space-y-6">
            {/* Header summary panel */}
            <div className="premium-card p-5 px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-brand-primary/8 text-brand-primary flex items-center justify-center border border-brand-primary/10">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-sans mb-0.5">
                    CLIENT ACCOUNTS
                  </div>
                  <div className="text-sm font-extrabold text-slate-800 leading-tight">
                    External Client Portfolio
                  </div>
                </div>
              </div>

              <div className="flex justify-between md:justify-end gap-6 md:gap-12 w-full md:w-auto">
                {[
                  { label: 'CLIENTS', value: extStats.clients, textStyle: 'text-slate-800 font-extrabold' },
                  { label: 'COMPLETED', value: extStats.completed, textStyle: 'text-slate-800 font-extrabold' },
                  { label: 'PENDING', value: extStats.pending, textStyle: 'text-slate-800 font-extrabold' },
                  { label: 'OVERDUE', value: extStats.overdue, textStyle: 'text-amber-600 font-black' }
                ].map(s => (
                  <div key={s.label} className="text-right">
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider mb-1 font-sans">{s.label}</div>
                    <div className={`text-xl leading-none font-sans font-extrabold ${s.textStyle}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {extProjects.map((client) => {
                const total = client.totalTasks || 0;
                const done = client.doneTasks || 0;
                const pending = client.pendingTasks || 0;
                const overdue = client.overdueTasks || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                const isCompleted = total > 0 && done === total;
                const isOverdue = overdue > 0;
                const isInProgress = !isCompleted && !isOverdue && pending > 0;

                let ringColorClass = "stroke-slate-400";
                let accentBarClass = "from-slate-400 to-slate-500";
                let hoverShadowClass = "hover:shadow-[0_8px_30px_rgba(100,116,139,0.12)]";
                let valueColorClass = "text-slate-800";
                
                if (isCompleted) {
                  ringColorClass = "stroke-[#92c13e]";
                  accentBarClass = "from-[#92c13e] to-[#7fa82f]";
                  hoverShadowClass = "hover:shadow-[0_8px_30px_rgba(146,193,62,0.15)]";
                  valueColorClass = "text-[#92c13e]";
                } else if (isOverdue) {
                  ringColorClass = "stroke-[#FFA000]";
                  accentBarClass = "from-[#FFA000] to-[#E68A00]";
                  hoverShadowClass = "hover:shadow-[0_8px_30px_rgba(255,160,0,0.15)]";
                  valueColorClass = "text-[#FFA000]";
                } else if (isInProgress) {
                  ringColorClass = "stroke-[#0097A7]";
                  accentBarClass = "from-[#0097A7] to-[#006064]";
                  hoverShadowClass = "hover:shadow-[0_8px_30px_rgba(0,151,167,0.15)]";
                  valueColorClass = "text-[#0097A7]";
                }

                return (
                  <div 
                    key={client.projectRef} 
                    className={`premium-card py-5 px-6 h-[140px] flex flex-col justify-between relative overflow-hidden select-none hover:scale-[1.02] hover:-translate-y-0.5 ${hoverShadowClass} transition-all duration-300 ease-out font-sans`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center justify-center text-slate-400 shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <MiniProgressRing value={pct} colorClass={ringColorClass} />
                    </div>

                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none truncate mb-3">
                        {client.projectRef} • {client.projectName.toUpperCase()}
                      </span>
                      <h2 className={`text-[34px] font-bold tracking-tight leading-none ${valueColorClass}`}>
                        {pct}%
                      </h2>
                    </div>

                    <div className={`absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b ${accentBarClass}`} />
                  </div>
                );
              })}

              {extProjects.length === 0 && (
                <div className="col-span-full bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 text-xs font-semibold italic">
                  No active external projects found in datasheet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== INTERNAL TAB ===== */}
        {activeTab === 'internal' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-2xl font-sans">
              Operational projects improving internal workflows, systems, and automations.
            </p>

            <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider font-sans">
                      <th className="p-4 pl-6">PROJECT</th>
                      <th className="p-4">OWNER</th>
                      <th className="p-4">TEAM</th>
                      <th className="p-4">COMPLETED</th>
                      <th className="p-4">PENDING</th>
                      <th className="p-4">PROGRESS</th>
                      <th className="p-4 pr-6">TARGET</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {intProjects.map((proj) => {
                      const total = proj.totalTasks || 0;
                      const done = proj.doneTasks || 0;
                      const pending = proj.pendingTasks || 0;
                      const overdue = proj.overdueTasks || 0;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                      return (
                        <tr 
                          key={proj.projectRef}
                          className="hover:bg-slate-50/40 transition-colors duration-150"
                        >
                          {/* Project info */}
                          <td className="p-4 pl-6 max-w-[280px]">
                            <div className="font-extrabold text-slate-800 mb-0.5 leading-snug font-sans">{proj.projectName}</div>
                            <div className="text-slate-400 text-[10px] font-bold font-sans">{proj.projectRef}</div>
                          </td>

                          {/* Owner */}
                          <td className="p-4 text-slate-700 font-extrabold whitespace-nowrap font-sans">
                            {proj.owner || 'Prajeeth'}
                          </td>

                          {/* Team */}
                          <td className="p-4">
                            <AvatarGroup initials={proj.teamInitials || ['P']} />
                          </td>

                          {/* Completed */}
                          <td className="p-4 text-slate-800 font-extrabold font-sans text-sm">
                            {done}
                          </td>

                          {/* Pending + Overdue warning */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-800 font-extrabold font-sans text-sm">{pending}</span>
                              {overdue > 0 && (
                                <span className="text-[8.5px] text-red-600 font-bold bg-red-50 border border-red-100 px-1.5 py-0.2 rounded-md whitespace-nowrap tracking-wide">
                                  {overdue} Overdue
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Progress */}
                          <td className="p-4">
                            <ProgressBar value={pct} />
                          </td>

                          {/* Target */}
                          <td className="p-4 pr-6 whitespace-nowrap text-slate-500 font-bold font-sans">
                            {proj.endDate || '—'}
                          </td>
                        </tr>
                      );
                    })}

                    {intProjects.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 font-semibold italic text-xs">
                          No active internal projects found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectProgressCenter;
