/**
 * Deepwoods Task Manager (DTM-V1)
 * apps_script/Auth.gs - Handles authenticating emails against team registries
 */

/**
 * Validates whether the given email exists in the sheet registry.
 * Returns authentication info and admin flag.
 */
function getAuthStatus(email, sheetIdOrSs) {
  if (!email) {
    return {
      authenticated: false,
      email: "",
      name: "Guest",
      isAdmin: false
    };
  }

  // Auto boot sheet structures if not already present
  const ss = getSpreadsheet(sheetIdOrSs);
  bootstrapDatabase(ss);

  const members = readSheetRows("team_config", ss);
  const member = members.find(m => m.memberEmail.toLowerCase() === email.toLowerCase());

  if (member) {
    return {
      authenticated: true,
      email: member.memberEmail,
      name: member.memberName,
      isAdmin: member.isAdmin === true || String(member.isAdmin).toLowerCase() === "true"
    };
  }

  return {
    authenticated: false,
    email: email,
    name: "Guest",
    isAdmin: false
  };
}
