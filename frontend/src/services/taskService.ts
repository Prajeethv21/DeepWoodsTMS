import api from './api';
import type { Task, CreateTaskPayload } from './api';

const taskService = {
  /**
   * Fetch today's tasks grouped by project for a member.
   */
  getTodayTasks: async (email: string): Promise<Record<string, Task[]>> => {
    try {
      return await api.get<Record<string, Task[]>>('getTodayTasks', { email });
    } catch (err) {
      console.error("Failed to load today's tasks: ", err);
      throw err;
    }
  },

  /**
   * Fetch task completion history, optionally filtered.
   */
  getHistory: async (email: string, projectFilter: string = ''): Promise<Task[]> => {
    try {
      return await api.get<Task[]>('getHistory', { email, projectFilter });
    } catch (err) {
      console.error("Failed to load task history: ", err);
      throw err;
    }
  },

  /**
   * Get project reference codes associated with member tasks.
   */
  getProjectRefs: async (email: string): Promise<string[]> => {
    try {
      return await api.get<string[]>('getProjectRefs', { email });
    } catch (err) {
      console.error("Failed to fetch project filters: ", err);
      throw err;
    }
  },

  /**
   * Update the status of a specific task and log completed timestamps.
   */
  updateStatus: async (taskId: string, status: string): Promise<boolean> => {
    try {
      return await api.post<boolean>('updateStatus', { taskId, status });
    } catch (err) {
      console.error("Failed to update status: ", err);
      throw err;
    }
  },

  /**
   * Write comments/remarks onto a task.
   */
  updateRemarks: async (taskId: string, remarks: string): Promise<boolean> => {
    try {
      return await api.post<boolean>('updateRemarks', { taskId, remarks });
    } catch (err) {
      console.error("Failed to update task remarks: ", err);
      throw err;
    }
  },

  /**
   * Create a new task in the sheet database.
   */
  createTask: async (email: string, taskData: CreateTaskPayload): Promise<{ success: boolean; taskId: string }> => {
    try {
      return await api.post<{ success: boolean; taskId: string }>('createTask', { email, taskData });
    } catch (err) {
      console.error("Failed to create task: ", err);
      throw err;
    }
  }
};

export default taskService;
