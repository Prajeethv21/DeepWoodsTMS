/**
 * Deepwoods Task Manager (DTM-V1)
 * apps_script/Code.gs - Router for incoming Web App endpoints (GET/POST)
 */

/**
 * Handle HTTP GET Requests.
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const token = params.token;
    const action = params.action;
    const email = params.email;
    const sheetId = params.sheetId; // Read sheetId from GET parameters

    // Validate access token
    if (!validateToken(token)) {
      return jsonError("Unauthorized API token key provided.");
    }

    if (!action) {
      return jsonError("Missing action parameter.");
    }

    const ss = getSpreadsheet(sheetId);

    switch (action) {
      case "getAuthStatus":
        const authInfo = getAuthStatus(email, ss);
        return jsonSuccess(authInfo);

      case "getTodayTasks":
        if (!email) return jsonError("Email parameter required.");
        const todayGrouped = getTodayTasks(email, ss);
        return jsonSuccess(todayGrouped);

      case "getHistory":
        if (!email) return jsonError("Email parameter required.");
        const projectFilter = params.projectFilter || "";
        const historyList = getHistory(email, projectFilter, ss);
        return jsonSuccess(historyList);

      case "getProjectRefs":
        if (!email) return jsonError("Email parameter required.");
        const refs = getProjectRefs(email, ss);
        return jsonSuccess(refs);

      case "getAdminData":
        if (!email) return jsonError("Email parameter required.");
        const auth = getAuthStatus(email, ss);
        if (!auth.isAdmin) {
          return jsonError("Access denied. Admin credentials required.");
        }
        const adminData = getAdminData(ss);
        return jsonSuccess(adminData);

      case "getEmailThreads":
        if (!email) return jsonError("Email parameter required.");
        const userAuth = getAuthStatus(email, ss);
        const threads = getEmailThreads(email, userAuth.isAdmin, ss);
        return jsonSuccess(threads);

      case "getThreadMessages":
        if (!email) return jsonError("Email parameter required.");
        const threadId = params.threadId;
        if (!threadId) return jsonError("Thread ID parameter required.");
        const userAuthMsg = getAuthStatus(email, ss);
        const messages = getThreadMessages(threadId, email, userAuthMsg.isAdmin, ss);
        return jsonSuccess(messages);

      default:
        return jsonError("Unsupported action GET query: " + action);
    }
  } catch (err) {
    return jsonError("Server doGet failure: " + err.toString());
  }
}

/**
 * Handle HTTP POST Requests.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonError("Empty post body request data.");
    }

    const payload = JSON.parse(e.postData.contents);
    const token = payload.token;
    const action = payload.action;
    const sheetId = payload.sheetId; // Read sheetId from POST body

    // Validate access token
    if (!validateToken(token)) {
      return jsonError("Unauthorized API token key provided.");
    }

    if (!action) {
      return jsonError("Missing action parameter in payload.");
    }

    const ss = getSpreadsheet(sheetId);

    switch (action) {
      case "updateStatus":
        const taskId = payload.taskId;
        const status = payload.status;
        if (!taskId || !status) return jsonError("Missing status or taskId fields.");
        updateTaskStatusInSheet(taskId, status, ss);
        return jsonSuccess({ taskId, status, success: true });

      case "updateRemarks":
        const remarkTaskId = payload.taskId;
        const remarks = payload.remarks;
        if (!remarkTaskId) return jsonError("Missing taskId field.");
        updateTaskRemarksInSheet(remarkTaskId, remarks, ss);
        return jsonSuccess({ taskId: remarkTaskId, remarks, success: true });

      case "runCarryForward":
        const adminEmail = payload.email;
        if (!adminEmail) return jsonError("Admin email parameter required.");
        
        const auth = getAuthStatus(adminEmail, ss);
        if (!auth.isAdmin) {
          return jsonError("Access denied. Admin credentials required to trigger carry-forward.");
        }
        
        const cfResult = runCarryForwardProcess(ss);
        return jsonSuccess(cfResult);

      case "bootstrapDatabase":
        const bootstrapEmail = payload.email;
        if (!bootstrapEmail) return jsonError("Admin email parameter required.");
        
        const bootstrapAuth = getAuthStatus(bootstrapEmail, ss);
        if (!bootstrapAuth.isAdmin) {
          return jsonError("Access denied. Admin credentials required to provision database.");
        }
        
        bootstrapDatabase(ss);
        return jsonSuccess({ success: true, message: "Database sheets provisioned successfully." });

      case "createTask":
        const creatorEmail = payload.email;
        if (!creatorEmail) return jsonError("Creator email required.");
        
        const creatorAuth = getAuthStatus(creatorEmail, ss);
        if (!creatorAuth.isAdmin) {
          return jsonError("Access denied. Admin credentials required to create tasks.");
        }
        
        const createTaskResult = createTaskInSheet(payload.taskData, ss);
        return jsonSuccess(createTaskResult);

      case "replyToThread":
        const replyEmail = payload.email;
        const replyThreadId = payload.threadId;
        const replyBody = payload.body;
        if (!replyEmail) return jsonError("Sender email required.");
        if (!replyThreadId) return jsonError("Thread ID required.");
        if (!replyBody) return jsonError("Reply content body is empty.");
        
        const replyAuth = getAuthStatus(replyEmail, ss);
        const replyResult = replyToThread(replyThreadId, replyBody, replyEmail, replyAuth.isAdmin, ss);
        return jsonSuccess(replyResult);

      default:
        return jsonError("Unsupported action POST query: " + action);
    }
  } catch (err) {
    return jsonError("Server doPost failure: " + err.toString());
  }
}
