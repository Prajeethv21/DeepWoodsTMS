/**
 * Deepwoods Task Manager (DTM-V1)
 * apps_script/EmailService.gs - Gmail integration and security boundaries
 */

/**
 * Searches Gmail threads associated with the requesting member or retrieves all inbox threads for admin.
 */
function getEmailThreads(email, isAdmin, sheetIdOrSs) {
  const ss = getSpreadsheet(sheetIdOrSs);
  const lowerEmail = email.toLowerCase();
  
  // Everyone (both admins and members) only sees threads containing their email OR their assigned task IDs
  const allTasks = getAllTasksMerged(ss);
  const userTasks = allTasks.filter(t => t.memberEmail.toLowerCase() === lowerEmail);
  const taskIds = userTasks.map(t => t.taskId).filter(Boolean);
  
  // Build query terms
  const queryTerms = [
    'to:"' + lowerEmail + '"',
    'cc:"' + lowerEmail + '"',
    'from:"' + lowerEmail + '"',
    '"' + lowerEmail + '"'
  ];
  
  // Limit to latest 30 task IDs to avoid Gmail query size limits
  const limitedTaskIds = taskIds.slice(-30);
  limitedTaskIds.forEach(id => {
    queryTerms.push('"' + id + '"');
  });
  
  const query = queryTerms.join(" OR ");
  
  try {
    const threads = GmailApp.search(query, 0, 30);
    const results = [];
    
    threads.forEach(thread => {
      const messages = thread.getMessages();
      if (messages.length === 0) return;
      const latestMsg = messages[messages.length - 1];
      
      let snippet = latestMsg.getPlainBody() || "";
      if (snippet.length > 120) {
        snippet = snippet.substring(0, 120) + "...";
      }
      // Strip extra whitespaces and newlines for a clean single-line preview
      snippet = snippet.replace(/\s+/g, " ").trim();
      
      results.push({
        id: thread.getId(),
        subject: thread.getFirstMessageSubject() || "(No Subject)",
        snippet: snippet,
        lastMessageDate: Utilities.formatDate(latestMsg.getDate(), "GMT+5:30", "yyyy-MM-dd HH:mm"),
        messageCount: thread.getMessageCount(),
        isUnread: thread.isUnread()
      });
    });
    
    return results;
  } catch (err) {
    console.error("Gmail search failed: ", err);
    throw new Error("Gmail search failed: " + err.toString());
  }
}

/**
 * Verifies if the user is authorized to access the specific thread.
 */
function isUserAuthorizedForThread(thread, email, isAdmin, ss) {
  const messages = thread.getMessages();
  const lowerEmail = email.toLowerCase();
  
  // 1. Check if email is sender, recipient, CC, or in body
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (
      msg.getFrom().toLowerCase().indexOf(lowerEmail) !== -1 ||
      msg.getTo().toLowerCase().indexOf(lowerEmail) !== -1 ||
      msg.getCc().toLowerCase().indexOf(lowerEmail) !== -1 ||
      msg.getPlainBody().toLowerCase().indexOf(lowerEmail) !== -1
    ) {
      return true;
    }
  }
  
  // 2. Check if thread matches any of the member's assigned task IDs in subject or body
  const allTasks = getAllTasksMerged(ss);
  const userTasks = allTasks.filter(t => t.memberEmail.toLowerCase() === lowerEmail);
  const taskIds = userTasks.map(t => t.taskId).filter(Boolean);
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const subject = msg.getSubject() || "";
    const body = msg.getPlainBody() || "";
    for (let j = 0; j < taskIds.length; j++) {
      const taskId = taskIds[j];
      if (subject.indexOf(taskId) !== -1 || body.indexOf(taskId) !== -1) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Retrieves the full message list for a specific thread, verifying authorization first.
 */
function getThreadMessages(threadId, email, isAdmin, sheetIdOrSs) {
  const ss = getSpreadsheet(sheetIdOrSs);
  try {
    const thread = GmailApp.getThreadById(threadId);
    if (!thread) {
      throw new Error("Thread not found.");
    }
    
    if (!isUserAuthorizedForThread(thread, email, isAdmin, ss)) {
      throw new Error("Access Denied: You do not have permission to view this email thread.");
    }
    
    const messages = thread.getMessages();
    return messages.map(msg => ({
      id: msg.getId(),
      from: msg.getFrom(),
      to: msg.getTo(),
      cc: msg.getCc() || "",
      date: Utilities.formatDate(msg.getDate(), "GMT+5:30", "yyyy-MM-dd HH:mm"),
      subject: msg.getSubject() || "",
      body: msg.getBody() // HTML body for viewing formatted messages
    }));
  } catch (err) {
    console.error("Failed to retrieve thread messages: ", err);
    throw new Error(err.message || "Failed to retrieve thread messages.");
  }
}

/**
 * Replies to a thread, verifying authorization first.
 * Appends a transparent system signature.
 */
function replyToThread(threadId, body, email, isAdmin, sheetIdOrSs) {
  const ss = getSpreadsheet(sheetIdOrSs);
  try {
    const thread = GmailApp.getThreadById(threadId);
    if (!thread) {
      throw new Error("Thread not found.");
    }
    
    if (!isUserAuthorizedForThread(thread, email, isAdmin, ss)) {
      throw new Error("Access Denied: You do not have permission to reply to this email thread.");
    }
    
    // Resolve user's display name from team_config if possible
    let senderName = email.split('@')[0];
    const members = readSheetRows("team_config", ss);
    const member = members.find(m => m.memberEmail.toLowerCase() === email.toLowerCase());
    if (member && member.memberName) {
      senderName = member.memberName;
    }
    
    const replySignature = "\n\n---\nSent by " + senderName + " (" + email + ") via Deepwoods Task Manager";
    const fullBody = body + replySignature;
    
    // Send reply
    thread.reply(fullBody);
    return { success: true, message: "Reply sent successfully." };
  } catch (err) {
    console.error("Failed to send reply to thread: ", err);
    throw new Error(err.message || "Failed to send reply to thread.");
  }
}

/**
 * Temporary helper to trigger Gmail authorization dialog in Apps Script editor.
 */
function triggerGmailAuthorization() {
  Logger.log("Triggering authorization...");
  GmailApp.search("subject:test", 0, 1);
}
