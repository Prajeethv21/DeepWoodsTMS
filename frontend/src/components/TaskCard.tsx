import React, { useState, useEffect } from 'react';
import type { Task } from '../services/api';
import PriorityBadge from './PriorityBadge';
import { MessageSquare, Check } from 'lucide-react';
import StatusToggle from './StatusToggle';

interface TaskCardProps {
  task: Task;
  onStatusUpdate: (taskId: string, newStatus: 'Yet to Start' | 'In Progress' | 'Done' | 'Overdue') => Promise<void>;
  onRemarksUpdate: (taskId: string, remarks: string) => Promise<void>;
  readOnly?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusUpdate, onRemarksUpdate, readOnly = false }) => {
  const [remarks, setRemarks] = useState(task.remarks || '');
  const [showRemarks, setShowRemarks] = useState(!!task.remarks);
  const [savingStatus, setSavingStatus] = useState<false | 'saving' | 'saved' | 'error'>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setRemarks(task.remarks || '');
  }, [task.remarks]);

  const handleRemarksBlur = async () => {
    if (remarks === task.remarks) return;
    
    setSavingStatus('saving');
    try {
      await onRemarksUpdate(task.taskId, remarks);
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus(false), 2000);
    } catch (err) {
      setSavingStatus('error');
      setTimeout(() => setSavingStatus(false), 4000);
    }
  };

  const toggleDone = async () => {
    if (readOnly || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const nextStatus = task.status === 'Done' ? 'Yet to Start' : 'Done';
      await onStatusUpdate(task.taskId, nextStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isDone = task.status === 'Done';
  const isOverdue = task.status === 'Overdue';
  const isInProgress = task.status === 'In Progress';

  const getBorderClass = () => {
    if (isDone) return 'border-l-4 border-l-brand-primary';
    if (isOverdue) return 'border-l-4 border-l-red-500';
    if (isInProgress) return 'border-l-4 border-l-amber-500';
    return 'border-l-4 border-l-slate-300';
  };

  return (
    <div className={`p-5 relative flex flex-col justify-between gap-3 border border-slate-100 rounded-[20px] transition-all duration-200 hover:border-slate-200 ${getBorderClass()} ${
      isDone ? 'opacity-80' : ''
    }`}>
      {/* Top Section */}
      <div className="flex gap-4 items-start">
        {/* Circular Checkbox Indicator */}
        {!readOnly ? (
          <button 
            onClick={toggleDone}
            disabled={isUpdatingStatus}
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
              isDone 
                ? 'bg-brand-primary border-brand-primary text-white scale-110 shadow-sm' 
                : 'border-slate-300 hover:border-brand-primary hover:bg-brand-primary/5 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        ) : (
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
            isDone ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'border-slate-200 text-transparent'
          }`}>
            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        )}

        {/* Content Group */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[9px] font-bold text-slate-400 font-sans tracking-wide">
              #{task.taskId}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {task.carriedForward && (
                <span className="text-[7.5px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100/60 px-1 py-0.2 rounded font-sans tracking-wider">
                  CF
                </span>
              )}
              <PriorityBadge priority={task.priority} />
            </div>
          </div>

          <h4 className={`text-xs font-bold text-slate-800 font-sans leading-snug break-words ${
            isDone ? 'line-through text-slate-400 font-medium' : ''
          }`}>
            {task.taskTitle}
          </h4>

          {task.taskDescription && (
            <p className={`text-[11px] text-slate-500 mt-1.5 leading-relaxed break-words font-medium ${
              isDone ? 'text-slate-400/80' : ''
            }`}>
              {task.taskDescription}
            </p>
          )}

          {isDone && task.completedAt && (
            <span className="text-[9px] text-brand-primary bg-brand-primary/8 border border-brand-primary/10 px-2 py-0.5 rounded-md mt-2 inline-flex items-center gap-1 font-bold">
              <span className="w-1 h-1 bg-brand-primary rounded-full animate-pulse" />
              Done {task.completedAt}
            </span>
          )}

          {isOverdue && (
            <span className="text-[9px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md mt-2 inline-flex items-center gap-1 font-bold">
              <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
              Overdue
            </span>
          )}

          {isInProgress && (
            <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md mt-2 inline-flex items-center gap-1 font-bold">
              <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
              In Progress
            </span>
          )}
        </div>
      </div>

      {/* Expanded Actions & Remarks */}
      <div className="mt-2 pt-2.5 border-t border-slate-100">
        <div className="flex justify-between items-center">
          {/* Status selector for detailed update */}
          <div className="flex items-center gap-2">
            <StatusToggle
              status={task.status}
              onChange={(newStatus) => onStatusUpdate(task.taskId, newStatus)}
              readOnly={readOnly}
            />
          </div>

          {/* Remarks trigger toggle */}
          <button 
            onClick={() => setShowRemarks(!showRemarks)}
            className={`flex items-center gap-1 text-[10px] font-bold py-1 px-2 rounded-lg transition-all ${
              showRemarks || remarks 
                ? 'text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Update Notes</span>
            {remarks && <span className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
          </button>
        </div>

        {/* Remarks Input block */}
        {showRemarks && (
          <div className="flex flex-col gap-1.5 mt-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center px-1">
              <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                Blockers / Updates
              </label>
              {savingStatus === 'saving' && (
                <span className="text-[8px] text-amber-600 font-bold animate-pulse">Saving...</span>
              )}
              {savingStatus === 'saved' && (
                <span className="text-[8px] text-green-700 font-bold">Saved ✓</span>
              )}
              {savingStatus === 'error' && (
                <span className="text-[8px] text-red-600 font-bold">Error ⚠️</span>
              )}
            </div>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onBlur={handleRemarksBlur}
              disabled={readOnly}
              placeholder={readOnly ? "No remarks provided." : "Write blocker or task progress updates (autosaves on click outside)..."}
              className="w-full min-h-[45px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 transition-all font-sans font-medium"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
