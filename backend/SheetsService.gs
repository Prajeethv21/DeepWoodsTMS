/**
 * Deepwoods Task Manager (DTM-V1)
 * apps_script/SheetsService.gs - Core CRUD operations and schema bootstrap
 */

/**
 * Retrieves the Active Spreadsheet or opens by ID if provided.
 */
function getSpreadsheet(sheetIdOrSs) {
  if (sheetIdOrSs && typeof sheetIdOrSs.getSheetByName === 'function') {
    return sheetIdOrSs;
  }
  if (sheetIdOrSs && typeof sheetIdOrSs === 'string') {
    try {
      return SpreadsheetApp.openById(sheetIdOrSs);
    } catch (err) {
      console.warn("Failed to open spreadsheet by ID: " + sheetIdOrSs + ", falling back to active bound sheet.");
    }
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    const active = SpreadsheetApp.getActive();
    if (active) return active;
    throw new Error("No active spreadsheet found. Please bind this script to a Google Sheet or provide a valid sheetId.");
  }
}

/**
 * Boots the database sheets with headers and mock data if they do not exist.
 * Matches DTM-V1_Dummy_Tasks_Sheet.xlsx tabs exactly.
 */
function bootstrapDatabase(sheetId) {
  const ss = getSpreadsheet(sheetId);
  
  // 1. Team Config Sheet
  let teamSheet = ss.getSheetByName("team_config");
  if (!teamSheet) {
    teamSheet = ss.insertSheet("team_config");
    const headers = ["member_name", "member_email", "is_admin"];
    teamSheet.getRange(1, 1, 1, headers.length).setValues([headers])
             .setFontWeight("bold")
             .setBackground("#92c13e")
             .setFontColor("#FFFFFF");
    
    const sampleUsers = [
      ["Aryann Admin", "aryann@deepwoods.in", "TRUE"],
      ["Prajeeth Developer", "prajeeth@deepwoods.in", "TRUE"],
      ["Pagi Frontend", "pagi@deepwoods.in", "FALSE"],
      ["Likith Admin", "likith@deepwoods.in", "FALSE"]
    ];
    teamSheet.getRange(2, 1, sampleUsers.length, 3).setValues(sampleUsers);
    teamSheet.autoResizeColumns(1, 3);
  }

  // 2. master_index Sheet (Projects index)
  let projectsSheet = ss.getSheetByName("master_index");
  if (!projectsSheet) {
    projectsSheet = ss.insertSheet("master_index");
    const headers = ["project_ref", "project_name", "project_type", "project_start_date", "project_end_date", "project_status"];
    projectsSheet.getRange(1, 1, 1, headers.length).setValues([headers])
                 .setFontWeight("bold")
                 .setBackground("#92c13e")
                 .setFontColor("#FFFFFF");
    
    const sampleProjects = [
      ["DTM-V1", "Deepwoods Task Manager", "INTERNAL", "2026-06-01", "2026-06-24", "Active"],
      ["DDC-FY26", "Acme Industries Portal", "EXTERNAL", "2026-05-10", "2026-07-15", "Active"]
    ];
    projectsSheet.getRange(2, 1, sampleProjects.length, 6).setValues(sampleProjects);
    projectsSheet.autoResizeColumns(1, 6);
  }

  // 3. internal_tasks Sheet
  let internalSheet = ss.getSheetByName("internal_tasks");
  if (!internalSheet) {
    internalSheet = ss.insertSheet("internal_tasks");
    const headers = [
      "row_counter", "task_id", "project_ref", "plan_level", "date", 
      "member_name", "member_email", "task_title", "task_description", 
      "priority", "status", "remarks", "carried_forward", "original_date", 
      "completed_at", "generated_by"
    ];
    internalSheet.getRange(1, 1, 1, headers.length).setValues([headers])
                 .setFontWeight("bold")
                 .setBackground("#92c13e")
                 .setFontColor("#FFFFFF");
  }

  // 4. external_tasks Sheet
  let externalSheet = ss.getSheetByName("external_tasks");
  if (!externalSheet) {
    externalSheet = ss.insertSheet("external_tasks");
    const headers = [
      "row_counter", "task_id", "project_ref", "plan_level", "date", 
      "member_name", "member_email", "task_title", "task_description", 
      "priority", "status", "remarks", "carried_forward", "original_date", 
      "completed_at", "generated_by"
    ];
    externalSheet.getRange(1, 1, 1, headers.length).setValues([headers])
                 .setFontWeight("bold")
                 .setBackground("#92c13e")
                 .setFontColor("#FFFFFF");
  }
}

/**
 * Helper to parse a sheet's rows into array of objects.
 * Automatically maps space-separated or underscore-separated headers to camelCase keys.
 */
function readSheetRows(sheetName, sheetId) {
  const ss = getSpreadsheet(sheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  const keys = headers.map(h => {
    let clean = h.replace(/[?]/g, "").trim();
    let parts = clean.split(/[\s_]+/);
    return parts[0].toLowerCase() + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  });
  
  return values.map((row, rIdx) => {
    const obj = { _rowNum: rIdx + 2 };
    keys.forEach((key, colIdx) => {
      let val = row[colIdx];
      // Format Date values cleanly to string
      if (key === "date" || key === "startDate" || key === "endDate" || key === "originalDate" || key === "projectStartDate" || key === "projectEndDate") {
        val = parseDateString(val);
      } else if (val instanceof Date) {
        val = Utilities.formatDate(val, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
      }
      obj[key] = val;
    });
    return obj;
  });
}

/**
 * Update task status (Column K - 11th column, Completed At - Column O - 15th column)
 * Searches in both internal_tasks and external_tasks sheets.
 */
function updateTaskStatusInSheet(taskId, status, sheetId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10s
    const ss = getSpreadsheet(sheetId);
    
    let sheet = ss.getSheetByName("internal_tasks");
    let idx = -1;
    let lastRow = 0;
    
    if (sheet) {
      lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const taskIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues().map(r => r[0]);
        idx = taskIds.indexOf(taskId);
      }
    }
    
    if (idx === -1) {
      sheet = ss.getSheetByName("external_tasks");
      if (sheet) {
        lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const taskIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues().map(r => r[0]);
          idx = taskIds.indexOf(taskId);
        }
      }
    }
    
    if (idx === -1) {
      throw new Error("Task ID " + taskId + " not found in internal_tasks or external_tasks sheets.");
    }
    
    const rowNum = idx + 2;
    
    // Set status (Column 11 - K)
    sheet.getRange(rowNum, 11).setValue(status);
    
    // Set completed_at timestamp (Column 15 - O)
    if (status === "Done") {
      sheet.getRange(rowNum, 15).setValue(getTimestamp());
    } else {
      sheet.getRange(rowNum, 15).setValue("");
    }
    
    return true;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update task remarks (Column L - 12th column)
 * Searches in both internal_tasks and external_tasks sheets.
 */
function updateTaskRemarksInSheet(taskId, remarks, sheetId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = getSpreadsheet(sheetId);
    
    let sheet = ss.getSheetByName("internal_tasks");
    let idx = -1;
    let lastRow = 0;
    
    if (sheet) {
      lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const taskIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues().map(r => r[0]);
        idx = taskIds.indexOf(taskId);
      }
    }
    
    if (idx === -1) {
      sheet = ss.getSheetByName("external_tasks");
      if (sheet) {
        lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const taskIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues().map(r => r[0]);
          idx = taskIds.indexOf(taskId);
        }
      }
    }
    
    if (idx === -1) {
      throw new Error("Task ID " + taskId + " not found in internal_tasks or external_tasks sheets.");
    }
    
    const rowNum = idx + 2;
    sheet.getRange(rowNum, 12).setValue(remarks);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Create a new task in internal_tasks or external_tasks sheet.
 * Generates next unique taskId automatically based on existing values.
 */
function createTaskInSheet(payload, sheetId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Wait up to 15s
    const ss = getSpreadsheet(sheetId);
    
    const isInternal = payload.isInternal === true || payload.isInternal === "true" || 
                       payload.projectRef.startsWith("INT") || payload.projectRef.startsWith("DTM") || 
                       payload.projectRef.toLowerCase().includes("ops");
                       
    const sheetName = isInternal ? "internal_tasks" : "external_tasks";
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Sheet " + sheetName + " not found.");
    }
    
    const internalTasks = readSheetRows("internal_tasks", ss);
    const externalTasks = readSheetRows("external_tasks", ss);
    const allTasks = internalTasks.concat(externalTasks);
    
    // Calculate next counter
    const currentSheetTasks = isInternal ? internalTasks : externalTasks;
    let nextCounter = 1;
    if (currentSheetTasks.length > 0) {
      nextCounter = Math.max(...currentSheetTasks.map(t => Number(t.rowCounter) || 0)) + 1;
    }
    
    // Generate new unique Task ID (Txxx)
    let maxIdNum = 0;
    allTasks.forEach(t => {
      if (t.taskId && t.taskId.startsWith("T")) {
        const num = parseInt(t.taskId.substring(1), 10);
        if (!isNaN(num) && num > maxIdNum) {
          maxIdNum = num;
        }
      }
    });
    const nextTaskId = "T" + String(maxIdNum + 1).padStart(3, '0');
    
    const todayStr = getTodayDateString();
    const taskDate = payload.date || todayStr;
    
    const newRow = [
      nextCounter,
      nextTaskId,
      payload.projectRef,
      payload.planLevel || "Task",
      taskDate,
      payload.memberName,
      payload.memberEmail,
      payload.taskTitle,
      payload.taskDescription || "",
      payload.priority || "Medium",
      payload.status || "Yet to Start",
      payload.remarks || "",
      false, // carried_forward = false
      taskDate, // original_date = taskDate
      "", // completed_at = ""
      payload.generatedBy || "System Admin Portal"
    ];
    
    sheet.appendRow(newRow);
    sheet.autoResizeColumns(1, 16);
    
    return { success: true, taskId: nextTaskId };
  } finally {
    lock.releaseLock();
  }
}

