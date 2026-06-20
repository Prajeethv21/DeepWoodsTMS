/**
 * Deepwoods Task Manager (DTM-V1)
 * apps_script/TriggerService.gs - Handles nightly carry-forwards and automated schedule triggers
 */

/**
 * Creates a nightly trigger to execute carryForward at 11:59 PM every night.
 * Can be run once manually to set up.
 */
function setupNightlyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerName = "runCarryForwardNightly";
  
  // Clean up existing trigger with the same name
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === triggerName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create new trigger
  ScriptApp.newTrigger(triggerName)
    .timeBased()
    .everyDay()
    .atHour(23)
    .nearMinute(55)
    .create();
}

/**
 * Wrapper for automated trigger execution.
 */
function runCarryForwardNightly() {
  console.log("Nightly trigger started at " + getTimestamp());
  const result = runCarryForwardProcess();
  console.log("Nightly trigger completed: " + JSON.stringify(result));
}

/**
 * Business logic for carrying forward uncompleted tasks.
 * Duplicate uncompleted tasks to today's task registry.
 * Processes both internal_tasks and external_tasks sheets.
 */
function runCarryForwardProcess(sheetIdOrSs) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Wait up to 15s
    const ss = getSpreadsheet(sheetIdOrSs);
    bootstrapDatabase(ss);
    
    const debug = {};
    const internalCount = carryForwardForSheet("internal_tasks", ss, debug);
    const externalCount = carryForwardForSheet("external_tasks", ss, debug);
    
    return { 
      success: true, 
      carriedCount: internalCount + externalCount,
      internalCount,
      externalCount,
      debug
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Executes carry-forward checks and writes for a specific tasks sheet.
 */
function carryForwardForSheet(sheetName, sheetIdOrSs, debug) {
  const ss = getSpreadsheet(sheetIdOrSs);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;
  
  const todayStr = getTodayDateString();
  const allTasks = readSheetRows(sheetName, ss);
  
  // Find uncompleted tasks from dates before today
  const overdueTasks = allTasks.filter(t => 
    t.status !== "Done" && 
    t.date < todayStr
  );
  
  if (debug) {
    debug[sheetName] = {
      todayStr: todayStr,
      totalTasks: allTasks.length,
      overdueCount: overdueTasks.length,
      overdueDetails: overdueTasks.map(t => ({ taskId: t.taskId, date: t.date, status: t.status })),
      tasksDump: allTasks.map(t => ({ taskId: t.taskId, date: t.date, status: t.status, memberEmail: t.memberEmail }))
    };
  }
  
  if (overdueTasks.length === 0) {
    return 0;
  }
  
  let nextRow = sheet.getLastRow() + 1;
  let nextCounter = 1;
  if (allTasks.length > 0) {
    nextCounter = Math.max(...allTasks.map(t => Number(t.rowCounter) || 0)) + 1;
  }
  
  let carriedCount = 0;
  const newRows = [];
  
  overdueTasks.forEach(task => {
    // Avoid duplicate carry forward
    const alreadyCarried = allTasks.some(t => 
      t.taskId === task.taskId && 
      t.date === todayStr
    );
    
    if (!alreadyCarried) {
      const originalDate = task.originalDate || task.date;
      
      newRows.push([
        nextCounter++,
        task.taskId,
        task.projectRef,
        task.planLevel,
        todayStr,
        task.memberName,
        task.memberEmail,
        task.taskTitle,
        task.taskDescription,
        task.priority,
        "Yet to Start", // reset status
        task.remarks || "", // preserve remarks
        true, // carriedForward = true
        originalDate,
        "", // completedAt is empty
        "System Auto Carry-Forward"
      ]);
      
      carriedCount++;
    }
  });
  
  if (newRows.length > 0) {
    sheet.getRange(nextRow, 1, newRows.length, 16).setValues(newRows);
    sheet.autoResizeColumns(1, 16);
  }
  
  return carriedCount;
}
