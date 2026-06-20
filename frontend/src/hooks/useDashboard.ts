import { useState, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import type { Project, TeamMemberStatus, MemberRanking, KPIStats } from '../services/api';

export default function useDashboard() {
  const [kpis, setKpis] = useState<KPIStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamStatus, setTeamStatus] = useState<TeamMemberStatus[]>([]);
  const [rankings, setRankings] = useState<MemberRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [carryForwardLoading, setCarryForwardLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all dashboard data.
   */
  const fetchDashboardData = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getAdminData(email);
      if (data) {
        setKpis(data.kpis || null);
        setProjects(data.projects || []);
        setTeamStatus(data.teamStatus || []);
        setRankings(data.rankings || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load admin dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manual run of nightly carry forward routine.
   */
  const runCarryForward = async (email: string) => {
    setCarryForwardLoading(true);
    setError(null);
    try {
      const result = await dashboardService.runCarryForward(email);
      // Reload dashboard stats to see changes
      await fetchDashboardData(email);
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to trigger task carry forward.");
      throw err;
    } finally {
      setCarryForwardLoading(false);
    }
  };

  /**
   * Manual run of database bootstrapping routine.
   */
  const runProvisionDatabase = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.provisionDatabase(email);
      // Reload stats
      await fetchDashboardData(email);
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to provision database sheets.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    kpis,
    projects,
    teamStatus,
    rankings,
    loading,
    carryForwardLoading,
    error,
    setError,
    fetchDashboardData,
    runCarryForward,
    runProvisionDatabase
  };
}
