import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import Header from '../components/Header';
import Toast from '../components/Toast';
import taskService from '../services/taskService';
import { ClipboardList, PlusCircle, User, Briefcase, Calendar, Flag, Layers } from 'lucide-react';

export const AssignTask: React.FC = () => {
  const auth = useAuth();
  const user = auth.user;

  const {
    fetchDashboardData,
    projects,
    teamStatus,
    loading,
    error
  } = useDashboard();

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [projectRef, setProjectRef] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isInternalProj, setIsInternalProj] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    if (user?.email) fetchDashboardData(user.email);
  }, [user?.email, fetchDashboardData]);

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (!taskTitle.trim() || !assigneeEmail || !projectRef) {
      showToast("Please fill in all required fields (Title, Assignee, Project).", 'error');
      return;
    }

    const member = teamStatus.find(m => m.email === assigneeEmail);
    const memberName = member ? member.name : "Unassigned";

    setAssignLoading(true);
    try {
      showToast("Creating and assigning task...", 'info');
      const payload = {
        projectRef,
        planLevel: "Task" as const,
        date: targetDate,
        memberName,
        memberEmail: assigneeEmail,
        taskTitle,
        taskDescription,
        priority,
        status: 'Yet to Start' as const,
        remarks: '',
        isInternal: isInternalProj,
        generatedBy: "Admin Portal"
      };
      await taskService.createTask(user.email, payload);
      showToast("Task assigned successfully!", 'success');
      setTaskTitle('');
      setTaskDescription('');
      setAssigneeEmail('');
      setProjectRef('');
      setTargetDate(new Date().toISOString().split('T')[0]);
      setPriority('Medium');
      setIsInternalProj(true);
    } catch (err: any) {
      showToast(err.message || "Failed to assign task.", 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      <Header />

      <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative">

        {/* ===== PAGE HEADER ===== */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase font-sans">ADMIN CONSOLE</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Assign New Task
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 font-sans">
              Create and allocate checklist items directly into the database
            </p>
          </div>
        </div>

        {loading && teamStatus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium font-sans">Loading assignment configurations...</p>
          </div>
        ) : (
          <form onSubmit={handleAssignTask} className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

            {/* ===== LEFT: Task Content (2/3 width on large) ===== */}
            <div className="xl:col-span-2 space-y-5">

              {/* Task Title */}
              <div>
                <label className="flex items-center gap-1.5 text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-2 font-sans">
                  <ClipboardList className="w-3 h-3" />
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="E.g., Complete UI Mockup Development"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all font-sans font-medium placeholder-slate-300"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="flex items-center gap-1.5 text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-2 font-sans">
                  <Layers className="w-3 h-3" />
                  Description / Milestones
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Describe the deliverables, checklist items, or link references..."
                  className="w-full min-h-[200px] border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all font-sans font-medium resize-none placeholder-slate-300"
                />
              </div>

              {/* Assignee + Project row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-2 font-sans">
                    <User className="w-3 h-3" />
                    Assignee *
                  </label>
                  <select
                    required
                    value={assigneeEmail}
                    onChange={(e) => setAssigneeEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-brand-primary transition-all font-bold cursor-pointer font-sans"
                  >
                    <option value="">Select Member</option>
                    {teamStatus.map(member => (
                      <option key={member.email} value={member.email}>{member.name} ({member.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-2 font-sans">
                    <Briefcase className="w-3 h-3" />
                    Project Reference *
                  </label>
                  <select
                    required
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-brand-primary transition-all font-bold cursor-pointer font-sans"
                  >
                    <option value="">Select Project</option>
                    {projects.map(proj => (
                      <option key={proj.projectRef} value={proj.projectRef}>{proj.projectRef}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date + Priority row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-2 font-sans">
                    <Calendar className="w-3 h-3" />
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-brand-primary transition-all font-bold cursor-pointer font-sans"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-2 font-sans">
                    <Flag className="w-3 h-3" />
                    Priority Level
                  </label>
                  <div className="flex gap-2 h-[46px]">
                    {(['Low', 'Medium', 'High'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                          priority === p
                            ? 'bg-brand-primary text-emerald-950 border-brand-primary shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ===== RIGHT: Summary Panel (1/3 width on large) ===== */}
            <div className="xl:col-span-1">
              <div className="border border-slate-100 rounded-[24px] p-6 space-y-5 sticky top-6">
                
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans border-b border-slate-100 pb-3">
                  Task Summary
                </div>

                {/* Portfolio Toggle */}
                <div>
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-2 block font-sans">
                    Portfolio
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalProj(true)}
                      className={`flex-1 py-2.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                        isInternalProj
                          ? 'bg-brand-primary text-emerald-950 border-brand-primary shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Internal
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalProj(false)}
                      className={`flex-1 py-2.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                        !isInternalProj
                          ? 'bg-brand-primary text-emerald-950 border-brand-primary shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Client
                    </button>
                  </div>
                </div>

                {/* Live preview of selections */}
                <div className="space-y-3 pt-1">
                  {[
                    { label: 'Title', value: taskTitle || '—' },
                    { label: 'Assignee', value: teamStatus.find(m => m.email === assigneeEmail)?.name || '—' },
                    { label: 'Project', value: projectRef || '—' },
                    { label: 'Date', value: targetDate },
                    { label: 'Priority', value: priority },
                    { label: 'Portfolio', value: isInternalProj ? 'Internal' : 'Client' }
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-start gap-3">
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider font-sans shrink-0">{item.label}</span>
                      <span className="text-[11px] font-bold text-slate-700 font-sans text-right truncate max-w-[140px]">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="w-full py-3.5 bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 font-sans mt-2"
                >
                  {assignLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Assigning Task...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 shrink-0" />
                      <span>Assign Task</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}
      </main>

      {toastMsg && (
        <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg(null)} />
      )}
    </div>
  );
};

export default AssignTask;
