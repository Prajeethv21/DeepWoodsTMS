import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import Header from '../components/Header';
import { Award, Trophy, Medal } from 'lucide-react';

export const EfficiencyRanking: React.FC = () => {
  const auth = useAuth();
  const user = auth.user;
  const searchQuery = auth.searchQuery || '';
  const { fetchDashboardData, teamStatus, loading } = useDashboard();
  const [activeTab, setActiveTab] = useState<'all' | 'external' | 'internal'>('all');

  useEffect(() => {
    if (user?.email) {
      fetchDashboardData(user.email);
    }
  }, [user?.email, fetchDashboardData]);

  // Compute rankings dynamically based on selected tab and teamStatus splits
  const computedRankings = React.useMemo(() => {
    if (!teamStatus || teamStatus.length === 0) {
      return [];
    }

    const mapped = teamStatus.map(m => {
      const hasSplits = typeof m.externalAssigned !== 'undefined' && m.externalAssigned !== null && (m.externalAssigned !== 0 || m.internalAssigned !== 0);

      let assigned = m.totalAssigned;
      let done = m.doneCount;
      let pending = m.pendingCount;
      let overdue = m.overdueCount;

      if (hasSplits) {
        if (activeTab === 'external') {
          assigned = m.externalAssigned ?? 0;
          done = m.externalDone ?? 0;
          pending = m.externalPending ?? 0;
          overdue = m.externalOverdue ?? 0;
        } else if (activeTab === 'internal') {
          assigned = m.internalAssigned ?? 0;
          done = m.internalDone ?? 0;
          pending = m.internalPending ?? 0;
          overdue = m.internalOverdue ?? 0;
        }
      } else {
        // Fallback proportional split estimation: 60% client / 40% internal
        if (activeTab === 'external') {
          assigned = Math.round(m.totalAssigned * 0.6) || (m.totalAssigned > 0 ? 1 : 0);
          done = Math.round(m.doneCount * 0.6);
          pending = Math.max(0, assigned - done);
          overdue = Math.round(m.overdueCount * 0.6);
        } else if (activeTab === 'internal') {
          assigned = Math.max(0, m.totalAssigned - Math.round(m.totalAssigned * 0.6));
          done = Math.max(0, m.doneCount - Math.round(m.doneCount * 0.6));
          pending = Math.max(0, assigned - done);
          overdue = Math.max(0, m.overdueCount - Math.round(m.overdueCount * 0.6));
        }
      }

      const efficiency = assigned > 0 ? Math.round((done / assigned) * 100) : 0;

      return {
        name: m.name,
        email: m.email,
        role: m.role,
        totalAssigned: assigned,
        done: done,
        pending: pending,
        overdue: overdue,
        efficiency: efficiency
      };
    });

    // Sort by efficiency descending, then done count descending, then name alphabetically
    const sorted = [...mapped].sort((a, b) => {
      if (b.efficiency !== a.efficiency) {
        return b.efficiency - a.efficiency;
      }
      if (b.done !== a.done) {
        return b.done - a.done;
      }
      return a.name.localeCompare(b.name);
    });

    // Assign absolute ranks
    return sorted.map((r, i) => ({
      ...r,
      rank: i + 1
    }));
  }, [teamStatus, activeTab]);

  // Determine top 3 podium items from computed rankings
  const podiums = React.useMemo(() => {
    const top3 = computedRankings.slice(0, 3);
    const podiumConfig = [
      { rank: 1, accent: 'border-t-brand-primary', bgClass: 'border-slate-100', icon: <Trophy className="w-5 h-5 text-brand-primary" />, rankLabel: 'Gold #1' },
      { rank: 2, accent: 'border-t-slate-300', bgClass: 'border-slate-100', icon: <Medal className="w-5 h-5 text-slate-500" />, rankLabel: 'Silver #2' },
      { rank: 3, accent: 'border-t-amber-500', bgClass: 'border-slate-100', icon: <Medal className="w-5 h-5 text-amber-600" />, rankLabel: 'Bronze #3' }
    ];

    return top3.map((r, i) => {
      const config = podiumConfig[i] || { rank: r.rank, accent: 'border-t-slate-200', bgClass: 'bg-white border-slate-100', icon: <Award className="w-5 h-5 text-slate-400" />, rankLabel: `#${r.rank}` };
      return {
        ...r,
        accent: config.accent,
        bgClass: config.bgClass,
        icon: config.icon,
        rankLabel: config.rankLabel
      };
    });
  }, [computedRankings]);

  // Apply search query filter to leaderboard table rows
  const leaderboardRows = React.useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();
    if (!lower) return computedRankings;
    return computedRankings.filter(r => 
      r.name.toLowerCase().includes(lower) || 
      r.email.toLowerCase().includes(lower) || 
      r.role.toLowerCase().includes(lower)
    );
  }, [computedRankings, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      <Header />

      <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative">
        {/* Title area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                TEAM LEADERS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Efficiency Leaderboard
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1 font-sans">
              Top performing team members ranked by daily task execution rate
            </p>
          </div>

          {/* Project Filters pills */}
          <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200/50 shadow-sm shrink-0">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'external', label: 'Client' },
              { id: 'internal', label: 'Internal' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Podium Grid (Top 3 ranks) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium font-sans">Calculating leaderboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {podiums.map(podium => (
              <div 
                key={podium.rank} 
                className={`p-6 flex flex-col justify-between h-[200px] border border-t-4 rounded-[24px] transition-all duration-300 hover:-translate-y-0.5 ${podium.bgClass} ${podium.accent}`}
              >
                {/* Top Row */}
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold tracking-wider font-sans uppercase text-slate-400">
                    {podium.rankLabel}
                  </span>
                  <span className="shrink-0">{podium.icon}</span>
                </div>

                {/* Center Profile */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200/40 flex items-center justify-center text-sm font-extrabold text-slate-800 shrink-0 uppercase shadow-sm font-sans">
                    {podium.name ? podium.name.charAt(0) : 'P'}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug font-sans">{podium.name}</h3>
                    <span className="text-[9.5px] text-slate-400 font-bold font-sans">{podium.role}</span>
                  </div>
                </div>

                {/* Bottom stats */}
                <div className="flex justify-between items-end border-t border-slate-200/20 pt-3">
                  <div>
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block font-sans">BURN RATE</span>
                    <span className="text-xs font-bold text-slate-700 font-sans">{podium.done}/{podium.totalAssigned} Done</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block font-sans">EFFICIENCY</span>
                    <span className="text-2xl font-extrabold text-slate-900 leading-none font-sans">{podium.efficiency}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Table section */}
        <div className="border border-slate-100 rounded-[28px] p-6 overflow-hidden">
          <h3 className="text-xs font-extrabold text-slate-850 font-sans uppercase tracking-wider mb-5">Full Leaderboard</h3>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider font-sans">
                    <th className="p-4 pl-6 w-[80px]">RANK</th>
                    <th className="p-4">MEMBER</th>
                    <th className="p-4">COMPLETED</th>
                    <th className="p-4">ASSIGNED</th>
                    <th className="p-4">EFFICIENCY</th>
                    <th className="p-4 pr-6 w-[80px] text-center">TREND</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboardRows.map(row => {
                    const trend = (row as any).trend || (row.rank <= 3 ? '↑' : '→');
                    return (
                      <tr 
                        key={row.email} 
                        className="hover:bg-slate-50/40 transition-colors duration-150"
                      >
                        <td className="p-4 pl-6 font-extrabold text-slate-400 font-sans text-sm">
                          #{row.rank}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-[10px] border border-brand-primary/10 shrink-0 uppercase font-sans">
                              {row.name ? row.name.charAt(0) : 'P'}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-800 leading-snug font-sans">{row.name}</div>
                              <div className="text-slate-400 text-[9px] font-bold font-sans">{row.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-800 font-extrabold text-sm font-sans">
                          {row.done}
                        </td>
                        <td className="p-4 text-slate-800 font-extrabold text-sm font-sans">
                          {row.totalAssigned}
                        </td>
                        <td className="p-4 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
                              <div 
                                className="h-full bg-brand-primary rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${row.efficiency}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 shrink-0 font-sans">{row.efficiency}%</span>
                          </div>
                        </td>
                        <td className={`p-4 pr-6 text-center font-extrabold text-base ${
                          trend === '↑' ? 'text-brand-primary' : (trend === '↓' ? 'text-red-500' : 'text-slate-400')
                        }`}>
                          {trend}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EfficiencyRanking;
