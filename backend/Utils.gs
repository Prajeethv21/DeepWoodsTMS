/**
 * Deepwoods Task Manager (DTM-V1)
 * apps_script/Utils.gs - Helpers for JSON response formatting and date management
 */

const API_TOKEN = "DEEPWOODS_SECRET_TOKEN_12345";

/**
 * Validates request token.
 */
function validateToken(token) {
  return token === API_TOKEN;
}

/**
 * Formats a successful JSON output.
 */
function jsonSuccess(data) {
  const output = {
    success: true,
    data: data
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Formats an error JSON output.
 */
function jsonError(message) {
  const output = {
    success: false,
    error: message
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Formats a timestamp as YYYY-MM-DD HH:mm:ss in India time zone (or standard local).
 */
function getTimestamp() {
  return Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
}

/**
 * Formats date as YYYY-MM-DD.
 */
function getTodayDateString() {
  return Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd");
}

/**
 * Normalizes any Date object or string format to YYYY-MM-DD.
 */
function parseDateString(dateVal) {
  if (!dateVal) return "";
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, "GMT+5:30", "yyyy-MM-dd");
  }
  
  const str = String(dateVal).trim();
  // Try to parse yyyy-mm-dd
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  // Try to parse dd/mm/yyyy
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }
  
  // Fallback to standard JS Date parsing
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, "GMT+5:30", "yyyy-MM-dd");
    }
  } catch (err) {}
  
  return str;
}
