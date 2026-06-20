import axios from 'axios';

// Shared GAS Secret Token
const API_TOKEN = "DEEPWOODS_SECRET_TOKEN_12345";

// Expose API URL
const getAppsScriptUrl = (): string => {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!url) {
    throw new Error("Configuration Error: VITE_APPS_SCRIPT_URL is not configured in .env. Mock fallback is disabled.");
  }
  return url;
};

export interface Task {
  rowCounter: number;
  taskId: string;
  projectRef: string;
  planLevel: string;
  date: string;
  memberName: string;
  memberEmail: string;
  taskTitle: string;
  taskDescription: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Yet to Start' | 'In Progress' | 'Done' | 'Overdue';
  remarks: string;
  carriedForward: boolean;
  originalDate: string;
  completedAt: string;
  generatedBy: string;
}

export interface CreateTaskPayload {
  projectRef: string;
  planLevel?: string;
  date: string;
  memberName: string;
  memberEmail: string;
  taskTitle: string;
  taskDescription?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'Yet to Start' | 'In Progress' | 'Done' | 'Overdue';
  remarks?: string;
  isInternal?: boolean;
  generatedBy?: string;
}

export interface User {
  name: string;
  email: string;
  isAdmin: boolean;
  picture?: string;
}

export interface Project {
  projectRef: string;
  projectName: string;
  startDate: string;
  endDate: string;
  status: string;
  isInternal: boolean;
  totalTasks?: number;
  doneTasks?: number;
  pendingTasks?: number;
  overdueTasks?: number;
  teamInitials?: string[];
  owner?: string;
}

export interface KPIStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  activeMembers: number;
  
  // Optional split counters for client/internal breakdown
  internalTotal?: number;
  internalDone?: number;
  internalPending?: number;
  internalOverdue?: number;
  internalInProgress?: number;
  internalYetToStart?: number;
  
  externalTotal?: number;
  externalDone?: number;
  externalPending?: number;
  externalOverdue?: number;
  externalInProgress?: number;
  externalYetToStart?: number;
}

export interface TeamMemberStatus {
  name: string;
  email: string;
  isAdmin: boolean;
  role: string;
  todayProject: string;
  todayType: string;
  todayTask: string;
  todayStatus: string;
  lastUpdated: string;
  totalAssigned: number;
  doneCount: number;
  pendingCount: number;
  overdueCount: number;
  rowHighlight: 'neutral' | 'green' | 'red' | 'yellow';

  // Optional split counters for client/internal breakdown
  internalAssigned?: number;
  internalDone?: number;
  internalPending?: number;
  internalOverdue?: number;
  
  externalAssigned?: number;
  externalDone?: number;
  externalPending?: number;
  externalOverdue?: number;
}

export interface MemberRanking {
  rank: number;
  name: string;
  email: string;
  role: string;
  efficiency: number;
  totalAssigned: number;
  done: number;
  pending: number;
  overdue: number;
}

export interface AdminDashboardData {
  kpis: KPIStats;
  projects: Project[];
  teamStatus: TeamMemberStatus[];
  rankings: MemberRanking[];
}

export interface AuthStatus {
  authenticated: boolean;
  email: string;
  name: string;
  isAdmin: boolean;
  picture?: string;
}

// Custom axios wrapper to avoid CORS preflight options blocks on GAS Web App URLs
const api = {
  get: async <T>(endpoint: string, params: Record<string, any> = {}): Promise<T> => {
    const url = getAppsScriptUrl();
    const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID || '';
    if (!sheetId) {
      throw new Error("Configuration Error: VITE_GOOGLE_SHEET_ID is not configured in .env.");
    }
    
    const queryParams = new URLSearchParams({
      ...params,
      action: endpoint,
      token: API_TOKEN,
      sheetId
    });
    
    const response = await axios.get(`${url}?${queryParams.toString()}`);
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || "Failed API transaction.");
    }
    return response.data.data as T;
  },
  
  post: async <T>(endpoint: string, body: Record<string, any> = {}): Promise<T> => {
    const url = getAppsScriptUrl();
    const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID || '';
    if (!sheetId) {
      throw new Error("Configuration Error: VITE_GOOGLE_SHEET_ID is not configured in .env.");
    }
    
    const payload = {
      ...body,
      action: endpoint,
      token: API_TOKEN,
      sheetId
    };
    
    // Send as text/plain simple request to bypass CORS preflight OPTIONS pre-check!
    const response = await axios.post(url, JSON.stringify(payload), {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || "Failed API write transaction.");
    }
    return response.data.data as T;
  }
};
export default api;
