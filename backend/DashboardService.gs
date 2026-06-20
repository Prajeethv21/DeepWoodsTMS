/**
 * Deepwoods Task Manager (DTM-V1)
 * apps_script/DashboardService.gs - Aggregates admin metrics, project lists, and member checklists
 */

/**
 * Helper to fetch all tasks from both internal_tasks and external_tasks sheets.
 */
function getAllTasksMerged(sheetIdOrSs) {
  const ss = getSpreadsheet(sheetIdOrSs);
  const internal = readSheetRows("internal_tasks", ss);
  const external = readSheetRows("external_tasks", ss);
  return internal.concat(external);
}

/**
 * Helper to check if a project is internal based on projectType or projectRef prefix.
 */
function isTaskInternal(task, projectTypes) {
  const type = projectTypes[task.projectRef];
  if (type) return type === "internal";
  return task.projectRef.startsWith("INT") || task.projectRef.startsWith("DTM") || task.projectRef.toLowerCase().includes("ops");
}

/**
 * Returns today's tasks for a specific member, grouped by project.
 */
function getTodayTasks(email, sheetIdOrSs) {
  const ss = getSpreadsheet(sheetIdOrSs);
  bootstrapDatabase(ss);
  const todayStr = getTodayDateString();
  const allTasks = getAllTasksMerged(ss);
  
  const userTasks = allTasks.filter(t => 
    t.memberEmail.toLowerCase() === email.toLowerCase() && 
    t.date === todayStr
  );
  
  const grouped = {};
  userTasks.forEach(task => {
    const proj = task.projectRef || "Unassigned";
    if (!grouped[proj]) {
      grouped[proj] = [];
    }
    grouped[proj].push(task);
  });
  
  return grouped;
}

/**
 * Returns historical tasks for a specific member, optionally filtered by project reference.
 */
function getHistory(email, projectFilter, sheetIdOrSs) {
  const ss = getSpreadsheet(sheetIdOrSs);
  bootstrapDatabase(ss);
  const allTasks = getAllTasksMerged(ss);
  
  let history = allTasks.filter(t => t.memberEmail.toLowerCase() === email.toLowerCase());
  
  if (projectFilter) {
    history = history.filter(t => t.projectRef.toLowerCase() === projectFilter.toLowerCase());
  }
  
  // Sort descending by date, then task ID
  return history.sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return b.taskId.localeCompare(a.taskId);
  });
}

/**
 * Returns list of project references assigned to a specific member (for drop-down filters).
 */
function getProjectRefs(email, sheetIdOrSs) {
  const ss = getSpreadsheet(sheetIdOrSs);
  bootstrapDatabase(ss);
  const allTasks = getAllTasksMerged(ss);
  const userTasks = allTasks.filter(t => t.memberEmail.toLowerCase() === email.toLowerCase());
  const refs = [...new Set(userTasks.map(t => t.projectRef))];
  return refs.sort();
}

/**
 * Aggregates summary KPIs, projects list, team statuses, and leaderboards.
 */
function getAdminData(sheetIdOrSs) {
  const ss = getSpreadsheet(sheetIdOrSs);
  bootstrapDatabase(ss);
  const todayStr = getTodayDateString();
  const allTasks = getAllTasksMerged(ss);
  const allProjects = readSheetRows("master_index", ss);
  const allMembers = readSheetRows("team_config", ss);

  // Map project refs to their type (internal vs external)
  const projectTypes = {};
  allProjects.forEach(p => {
    projectTypes[p.projectRef] = String(p.projectType).toLowerCase();
  });

  const internalTasks = allTasks.filter(t => isTaskInternal(t, projectTypes));
  const externalTasks = allTasks.filter(t => !isTaskInternal(t, projectTypes));

  // 1. KPI Summaries
  const totalProjects = allProjects.length;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === "Done").length;
  const pendingTasks = allTasks.filter(t => t.status !== "Done").length;
  const overdueTasks = allTasks.filter(t => t.status !== "Done" && t.date < todayStr).length;
  const activeMembers = [...new Set(allTasks.map(t => t.memberEmail.toLowerCase()))].length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const kpis = {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    inProgressTasks: allTasks.filter(t => t.status === "In Progress").length,
    yetToStartTasks: allTasks.filter(t => t.status === "Yet to Start").length,
    completionRate,
    activeMembers,
    
    // Internal specific
    internalTotal: internalTasks.length,
    internalDone: internalTasks.filter(t => t.status === "Done").length,
    internalPending: internalTasks.filter(t => t.status !== "Done").length,
    internalOverdue: internalTasks.filter(t => t.status !== "Done" && t.date < todayStr).length,
    internalInProgress: internalTasks.filter(t => t.status === "In Progress").length,
    internalYetToStart: internalTasks.filter(t => t.status === "Yet to Start").length,
    
    // External specific
    externalTotal: externalTasks.length,
    externalDone: externalTasks.filter(t => t.status === "Done").length,
    externalPending: externalTasks.filter(t => t.status !== "Done").length,
    externalOverdue: externalTasks.filter(t => t.status !== "Done" && t.date < todayStr).length,
    externalInProgress: externalTasks.filter(t => t.status === "In Progress").length,
    externalYetToStart: externalTasks.filter(t => t.status === "Yet to Start").length
  };

  // 2. Projects aggregation
  const projectsAgg = allProjects.map(proj => {
    const pTasks = allTasks.filter(t => t.projectRef === proj.projectRef);
    const doneTasks = pTasks.filter(t => t.status === "Done").length;
    const pendingCount = pTasks.length - doneTasks;
    const overdueCount = pTasks.filter(t => t.status !== "Done" && t.date < todayStr).length;
    
    // Team initials
    const teamInitials = [...new Set(pTasks.map(t => t.memberName ? t.memberName.charAt(0).toUpperCase() : ""))].filter(Boolean);
    const isInternalProj = proj.projectType === "INTERNAL" || String(proj.projectType).toLowerCase() === "internal";
    
    return {
      projectRef: proj.projectRef,
      projectName: proj.projectName,
      startDate: proj.projectStartDate,
      endDate: proj.projectEndDate,
      status: proj.projectStatus || "Active",
      isInternal: isInternalProj,
      totalTasks: pTasks.length,
      doneTasks: doneTasks,
      pendingTasks: pendingCount,
      overdueTasks: overdueCount,
      teamInitials,
      owner: pTasks[0]?.memberName || "Unassigned"
    };
  });

  // 3. Team member statuses
  const teamStatus = allMembers.map(m => {
    const mTasks = allTasks.filter(t => t.memberEmail.toLowerCase() === m.memberEmail.toLowerCase());
    const done = mTasks.filter(t => t.status === "Done").length;
    const todayTask = mTasks.find(t => t.date === todayStr);

    let rowHighlight = "neutral";
    if (mTasks.length > 0 && done === mTasks.length) {
      rowHighlight = "green"; // completed all assigned
    } else if (mTasks.some(t => t.status !== "Done" && t.date < todayStr)) {
      rowHighlight = "red"; // has overdue tasks
    } else if (todayTask && todayTask.status === "In Progress") {
      rowHighlight = "yellow"; // active today
    }

    // Split member tasks into internal and external
    const mInternalTasks = mTasks.filter(t => isTaskInternal(t, projectTypes));
    const mExternalTasks = mTasks.filter(t => !isTaskInternal(t, projectTypes));
    
    const internalDone = mInternalTasks.filter(t => t.status === "Done").length;
    const externalDone = mExternalTasks.filter(t => t.status === "Done").length;

    return {
      name: m.memberName,
      email: m.memberEmail,
      isAdmin: m.isAdmin === true || String(m.isAdmin).toLowerCase() === "true",
      role: (m.isAdmin === true || String(m.isAdmin).toLowerCase() === "true") ? "System Administrator" : "Team Member",
      todayProject: todayTask ? todayTask.projectRef : "-",
      todayType: todayTask ? (isTaskInternal(todayTask, projectTypes) ? "INTERNAL" : "EXTERNAL") : "-",
      todayTask: todayTask ? todayTask.taskTitle : "No tasks assigned today",
      todayStatus: todayTask ? todayTask.status : "-",
      lastUpdated: todayTask && todayTask.completedAt ? todayTask.completedAt : (todayTask ? "Assigned" : "-"),
      
      // Total Aggregated checklist counters
      totalAssigned: mTasks.length,
      doneCount: done,
      pendingCount: mTasks.length - done,
      overdueCount: mTasks.filter(t => t.status !== "Done" && t.date < todayStr).length,
      
      // Internal split checklist counters
      internalAssigned: mInternalTasks.length,
      internalDone: internalDone,
      internalPending: mInternalTasks.length - internalDone,
      internalOverdue: mInternalTasks.filter(t => t.status !== "Done" && t.date < todayStr).length,
      
      // External split checklist counters
      externalAssigned: mExternalTasks.length,
      externalDone: externalDone,
      externalPending: mExternalTasks.length - externalDone,
      externalOverdue: mExternalTasks.filter(t => t.status !== "Done" && t.date < todayStr).length,
      
      rowHighlight
    };
  });

  // 4. Rankings efficiency leaderboard
  const rankings = teamStatus.map(m => {
    const eff = m.totalAssigned > 0 ? Math.round((m.doneCount / m.totalAssigned) * 100) : 0;
    return {
      name: m.name,
      email: m.email,
      role: m.role,
      efficiency: eff,
      totalAssigned: m.totalAssigned,
      done: m.doneCount,
      pending: m.pendingCount,
      overdue: m.overdueCount
    };
  }).sort((a, b) => b.efficiency - a.efficiency);
  
  rankings.forEach((r, i) => r.rank = i + 1);

  return {
    kpis,
    projects: projectsAgg,
    teamStatus,
    rankings
  };
}
