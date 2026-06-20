import { useState, useCallback } from 'react';
import taskService from '../services/taskService';
import type { Task } from '../services/api';

export default function useTasks() {
  const [todayTasks, setTodayTasks] = useState<Record<string, Task[]>>({}); // grouped by projectRef
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [projectFilters, setProjectFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch today's tasks for a member.
   */
  const fetchTodayTasks = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTodayTasks(email);
      setTodayTasks(data || {});
    } catch (err: any) {
      setError(err.message || "Failed to load today's tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch historical tasks.
   */
  const fetchHistory = useCallback(async (email: string, projectFilter: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getHistory(email, projectFilter);
      setHistoryTasks(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load task history.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch unique project codes for dropdown filter.
   */
  const fetchProjectFilters = useCallback(async (email: string) => {
    try {
      const data = await taskService.getProjectRefs(email);
      setProjectFilters(data || []);
    } catch (err) {
      console.error("Failed to load project filters: ", err);
    }
  }, []);

  /**
   * Optimistically update status and dispatch write.
   */
  const updateStatus = async (taskId: string, newStatus: 'Yet to Start' | 'In Progress' | 'Done' | 'Overdue') => {
    // 1. Save original state for rollbacks
    const previousState = { ...todayTasks };
    
    // 2. Apply change locally (optimistic UI update)
    const updated = { ...todayTasks };
    let found = false;
    const completedTimestamp = newStatus === 'Done' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : '';

    for (const proj in updated) {
      updated[proj] = updated[proj].map(task => {
        if (task.taskId === taskId) {
          found = true;
          return { ...task, status: newStatus, completedAt: completedTimestamp };
        }
        return task;
      });
    }
    
    if (found) {
      setTodayTasks(updated);
    }

    // 3. Dispatch server write
    try {
      await taskService.updateStatus(taskId, newStatus);
    } catch (err) {
      console.error("Failed to sync task status to spreadsheet: ", err);
      setError("Failed to sync status. Rolling back change.");
      setTodayTasks(previousState);
      throw err;
    }
  };

  /**
   * Optimistically update remarks and dispatch write.
   */
  const updateRemarks = async (taskId: string, remarksText: string) => {
    const previousState = { ...todayTasks };
    
    // Update local state
    const updated = { ...todayTasks };
    let found = false;
    for (const proj in updated) {
      updated[proj] = updated[proj].map(task => {
        if (task.taskId === taskId) {
          found = true;
          return { ...task, remarks: remarksText };
        }
        return task;
      });
    }
    
    if (found) {
      setTodayTasks(updated);
    }

    try {
      await taskService.updateRemarks(taskId, remarksText);
    } catch (err) {
      console.error("Failed to sync remarks to spreadsheet: ", err);
      setError("Failed to sync remarks. Rolling back change.");
      setTodayTasks(previousState);
      throw err;
    }
  };

  return {
    todayTasks,
    historyTasks,
    projectFilters,
    loading,
    error,
    setError,
    fetchTodayTasks,
    fetchHistory,
    fetchProjectFilters,
    updateStatus,
    updateRemarks
  };
}
