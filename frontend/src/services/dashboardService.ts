import api from './api';
import type { AdminDashboardData } from './api';

const dashboardService = {
  /**
   * Fetches summary statistics, member status, and efficiency metrics.
   */
  getAdminData: async (email: string): Promise<AdminDashboardData> => {
    try {
      return await api.get<AdminDashboardData>('getAdminData', { email });
    } catch (err) {
      console.error("Failed to fetch admin dashboard metrics: ", err);
      throw err;
    }
  },

  /**
   * Manually triggers the nightly carry forward routine from the UI (admin only).
   */
  runCarryForward: async (email: string): Promise<{ success: boolean; carriedCount: number }> => {
    try {
      return await api.post<{ success: boolean; carriedCount: number }>('runCarryForward', { email });
    } catch (err) {
      console.error("Failed to run carry forward: ", err);
      throw err;
    }
  },

  /**
   * Manually provisions/bootstraps the database sheets (admin only).
   */
  provisionDatabase: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      return await api.post<{ success: boolean; message: string }>('bootstrapDatabase', { email });
    } catch (err) {
      console.error("Failed to provision database: ", err);
      throw err;
    }
  }
};

export default dashboardService;
